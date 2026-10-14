import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type pg from "pg";
import { z } from "zod";
import type { SkillCategory } from "@vq/shared";
import { createPool } from "./pool";

const CATEGORIES = [
  "frontend",
  "backend",
  "ai",
  "data",
  "design",
  "other",
] as const;
// Compile-time check that the zod enum values equal the shared SkillCategory union.
type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const _categoriesMatchShared: Equal<
  (typeof CATEGORIES)[number],
  SkillCategory
> = true;
void _categoriesMatchShared;

const nullableStr = z.string().nullable();

const SkillSchema = z
  .object({
    name: z.string().min(1),
    category: z.enum(CATEGORIES),
    level: z.number().int().min(1).max(5),
  })
  .strict();

const MemberProjectSchema = z
  .object({
    title: z.string().min(1),
    summary: z.string(),
    tech: z.array(z.string()),
    repo_url: nullableStr,
    demo_url: nullableStr,
    image_url: nullableStr,
    contribution: nullableStr,
  })
  .strict();

const MemberSchema = z
  .object({
    slug: z.string().min(1),
    name: z.string().min(1),
    nickname: nullableStr,
    role: z.string().min(1),
    bio: nullableStr,
    avatar_url: nullableStr,
    sort_order: z.number().int(),
    skills: z.array(SkillSchema),
    projects: z.array(MemberProjectSchema),
  })
  .strict();

const TeamProjectSchema = z
  .object({
    title: z.string().min(1),
    summary: z.string(),
    tech: z.array(z.string()),
    repo_url: nullableStr,
    demo_url: nullableStr,
    image_url: nullableStr,
    members: z.array(
      z.object({ slug: z.string().min(1), contribution: nullableStr }).strict(),
    ),
  })
  .strict();

const TeamSchema = z
  .object({
    name: z.string().min(1),
    tagline: nullableStr,
    concept: nullableStr,
    highlights: z.array(z.string()),
    contacts: z.array(
      z
        .object({
          type: z.string().min(1),
          label: z.string().min(1),
          url: z.string().min(1),
        })
        .strict(),
    ),
    team_projects: z.array(TeamProjectSchema),
  })
  .strict();

export type TeamSeed = z.infer<typeof TeamSchema>;
export type MemberSeed = z.infer<typeof MemberSchema>;
export interface SeedData {
  team: TeamSeed;
  members: MemberSeed[];
}

async function readJson<T>(file: string, schema: z.ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(file, "utf8"));
  } catch (err) {
    throw new Error(
      `Invalid seed file ${path.basename(file)}: ${(err as Error).message}`,
      { cause: err },
    );
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid seed file ${path.basename(file)}: ${issues}`);
  }
  return parsed.data;
}

/** Reads and validates `team.json` and `members/*.json` under `dir`. */
export async function loadSeed(dir: string): Promise<SeedData> {
  const team = await readJson(path.join(dir, "team.json"), TeamSchema);
  const files = (await readdir(path.join(dir, "members")))
    .filter((f) => f.endsWith(".json"))
    .sort();
  const members: MemberSeed[] = [];
  for (const f of files)
    members.push(await readJson(path.join(dir, "members", f), MemberSchema));
  members.sort(
    (a, b) => a.sort_order - b.sort_order || a.slug.localeCompare(b.slug),
  );
  return { team, members };
}

interface ProjectInput {
  title: string;
  summary: string;
  tech: string[];
  repo_url: string | null;
  demo_url: string | null;
  image_url: string | null;
}

async function upsertProject(
  client: pg.PoolClient,
  p: ProjectInput,
  isTeam: boolean,
): Promise<number> {
  const { rows } = await client.query<{ id: number }>(
    `INSERT INTO projects (title, summary, tech, repo_url, demo_url, image_url, is_team_project)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (title) DO UPDATE SET summary = EXCLUDED.summary, tech = EXCLUDED.tech,
       repo_url = EXCLUDED.repo_url, demo_url = EXCLUDED.demo_url,
       image_url = EXCLUDED.image_url, is_team_project = EXCLUDED.is_team_project
     RETURNING id`,
    [p.title, p.summary, p.tech, p.repo_url, p.demo_url, p.image_url, isTeam],
  );
  return rows[0].id;
}

/** Makes the database match `data` exactly, in one transaction. */
export async function applySeed(pool: pg.Pool, data: SeedData): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // team (exactly one row) and contacts (fully replaced)
    const { team } = data;
    await client.query("DELETE FROM team");
    await client.query(
      "INSERT INTO team (name, tagline, concept, highlights) VALUES ($1, $2, $3, $4)",
      [team.name, team.tagline, team.concept, team.highlights],
    );
    await client.query("DELETE FROM team_contacts");
    for (const c of team.contacts) {
      await client.query(
        "INSERT INTO team_contacts (type, label, url) VALUES ($1, $2, $3)",
        [c.type, c.label, c.url],
      );
    }

    // members
    const memberIds = new Map<string, number>();
    for (const m of data.members) {
      const { rows } = await client.query<{ id: number }>(
        `INSERT INTO members (slug, name, nickname, role, bio, avatar_url, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, nickname = EXCLUDED.nickname,
           role = EXCLUDED.role, bio = EXCLUDED.bio, avatar_url = EXCLUDED.avatar_url,
           sort_order = EXCLUDED.sort_order
         RETURNING id`,
        [m.slug, m.name, m.nickname, m.role, m.bio, m.avatar_url, m.sort_order],
      );
      memberIds.set(m.slug, rows[0].id);
    }
    await client.query("DELETE FROM members WHERE slug <> ALL($1::text[])", [
      data.members.map((m) => m.slug),
    ]);

    // skills + member_skills
    const skillNames = [
      ...new Set(data.members.flatMap((m) => m.skills.map((s) => s.name))),
    ];
    const skillIds = new Map<string, number>();
    for (const m of data.members) {
      for (const s of m.skills) {
        const { rows } = await client.query<{ id: number }>(
          `INSERT INTO skills (name, category) VALUES ($1, $2)
           ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category RETURNING id`,
          [s.name, s.category],
        );
        skillIds.set(s.name, rows[0].id);
      }
    }
    await client.query("DELETE FROM skills WHERE name <> ALL($1::text[])", [
      skillNames,
    ]);
    for (const m of data.members) {
      const memberId = memberIds.get(m.slug)!;
      await client.query("DELETE FROM member_skills WHERE member_id = $1", [
        memberId,
      ]);
      for (const s of m.skills) {
        await client.query(
          "INSERT INTO member_skills (member_id, skill_id, level) VALUES ($1, $2, $3)",
          [memberId, skillIds.get(s.name)!, s.level],
        );
      }
    }

    // projects + project_members
    const projectIds: number[] = [];
    const links: {
      projectId: number;
      memberId: number;
      contribution: string | null;
    }[] = [];
    for (const m of data.members) {
      for (const p of m.projects) {
        const id = await upsertProject(client, p, false);
        projectIds.push(id);
        links.push({
          projectId: id,
          memberId: memberIds.get(m.slug)!,
          contribution: p.contribution,
        });
      }
    }
    for (const p of team.team_projects) {
      const id = await upsertProject(client, p, true);
      projectIds.push(id);
      for (const tm of p.members) {
        const memberId = memberIds.get(tm.slug);
        if (memberId === undefined) {
          throw new Error(
            `Team project "${p.title}" references unknown member slug "${tm.slug}"`,
          );
        }
        links.push({ projectId: id, memberId, contribution: tm.contribution });
      }
    }
    await client.query("DELETE FROM projects WHERE id <> ALL($1::int[])", [
      projectIds,
    ]);
    await client.query(
      "DELETE FROM project_members WHERE project_id = ANY($1::int[])",
      [projectIds],
    );
    for (const l of links) {
      await client.query(
        `INSERT INTO project_members (project_id, member_id, contribution) VALUES ($1, $2, $3)
         ON CONFLICT (project_id, member_id) DO UPDATE SET contribution = EXCLUDED.contribution`,
        [l.projectId, l.memberId, l.contribution],
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

const REPO_SEED_DIR = fileURLToPath(
  new URL("../../../../seed", import.meta.url),
);

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const data = await loadSeed(REPO_SEED_DIR);
  const pool = createPool(url);
  try {
    await applySeed(pool, data);
    console.log(
      `Seeded team "${data.team.name}" with ${data.members.length} members`,
    );
  } finally {
    await pool.end();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
