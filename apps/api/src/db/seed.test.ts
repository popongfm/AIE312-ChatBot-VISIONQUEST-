import { fileURLToPath } from "node:url";
import type pg from "pg";
import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { testPool, resetDb } from "../../test/helpers/db";
import { applySeed, loadSeed } from "./seed";

const FIXTURE_DIR = fileURLToPath(
  new URL("../../test/fixtures/seed", import.meta.url),
);
const BAD_FIXTURE_DIR = fileURLToPath(
  new URL("../../test/fixtures/seed-bad", import.meta.url),
);
const REPO_SEED_DIR = fileURLToPath(
  new URL("../../../../seed", import.meta.url),
);

const pool = testPool();

async function counts(p: pg.Pool): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const t of [
    "team",
    "team_contacts",
    "members",
    "skills",
    "member_skills",
    "projects",
    "project_members",
  ]) {
    out[t] = Number(
      (await p.query<{ n: string }>(`SELECT count(*) AS n FROM ${t}`)).rows[0]
        .n,
    );
  }
  return out;
}

beforeEach(async () => {
  await resetDb(pool);
});
afterAll(() => pool.end());

describe("seed", () => {
  test("applySeed twice keeps row counts", async () => {
    const data = await loadSeed(FIXTURE_DIR);
    await applySeed(pool, data);
    const first = await counts(pool);
    await applySeed(pool, data);
    expect(await counts(pool)).toEqual(first);
    expect(first).toMatchObject({
      team: 1,
      members: 2,
      team_contacts: 2,
      skills: 3,
      projects: 3,
    });
  });

  test("loads members in sort order with mickie top skill level 5", async () => {
    const data = await loadSeed(FIXTURE_DIR);
    expect(data.members.map((m) => m.slug)).toEqual(["mickie", "art"]);
    expect(Math.max(...data.members[0].skills.map((s) => s.level))).toBe(5);
  });

  test("member removed from data is deleted with its links", async () => {
    const data = await loadSeed(FIXTURE_DIR);
    await applySeed(pool, data);
    await applySeed(pool, {
      team: {
        ...data.team,
        team_projects: data.team.team_projects.map((p) => ({
          ...p,
          members: p.members.filter((m) => m.slug !== data.members[1].slug),
        })),
      },
      members: data.members.slice(0, 1),
    });
    expect((await counts(pool)).members).toBe(1);
    expect(
      (
        await pool.query(
          "SELECT 1 FROM member_skills ms JOIN members m ON m.id = ms.member_id WHERE m.slug = $1",
          [data.members[1].slug],
        )
      ).rowCount,
    ).toBe(0);
  });

  test("skills and projects absent from data are deleted", async () => {
    const data = await loadSeed(FIXTURE_DIR);
    await applySeed(pool, data);
    await applySeed(pool, {
      team: { ...data.team, team_projects: [] },
      members: [{ ...data.members[0], skills: [], projects: [] }],
    });
    const c = await counts(pool);
    expect(c).toMatchObject({
      members: 1,
      skills: 0,
      member_skills: 0,
      projects: 0,
    });
  });

  test("invalid level names the file", async () => {
    await expect(loadSeed(BAD_FIXTURE_DIR)).rejects.toThrow(/bad-level\.json/);
  });

  test("team project links members by slug with contribution", async () => {
    await applySeed(pool, await loadSeed(FIXTURE_DIR));
    const { rows } = await pool.query<{
      slug: string;
      contribution: string | null;
    }>(
      `SELECT m.slug, pm.contribution FROM project_members pm
         JOIN projects p ON p.id = pm.project_id JOIN members m ON m.id = pm.member_id
        WHERE p.is_team_project ORDER BY m.sort_order`,
    );
    expect(rows).toEqual([
      { slug: "mickie", contribution: "Built the AI part" },
      { slug: "art", contribution: "Built the UI" },
    ]);
  });

  test("personal project is linked to its member and not a team project", async () => {
    await applySeed(pool, await loadSeed(FIXTURE_DIR));
    const { rows } = await pool.query(
      `SELECT p.is_team_project, pm.contribution FROM projects p
         JOIN project_members pm ON pm.project_id = p.id
        WHERE p.title = 'Mickie Personal Project'`,
    );
    expect(rows).toEqual([
      { is_team_project: false, contribution: "Everything" },
    ]);
  });

  test("unknown slug in team project throws and rolls back", async () => {
    const data = await loadSeed(FIXTURE_DIR);
    data.team.team_projects[0].members.push({
      slug: "ghost",
      contribution: null,
    });
    await expect(applySeed(pool, data)).rejects.toThrow(/ghost/);
    expect((await counts(pool)).members).toBe(0);
  });

  test("real seed/ folder is valid", async () => {
    const data = await loadSeed(REPO_SEED_DIR);
    expect(data.team.name).toBe("VISIONQUEST");
    expect(data.members.map((m) => m.slug)).toEqual([
      "mickie",
      "member-2",
      "member-3",
    ]);
  });
});
