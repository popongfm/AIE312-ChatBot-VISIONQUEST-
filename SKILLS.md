# VISIONQUEST — แหล่งรวมการเรียกใช้สกิล (Skill Hub)

ศูนย์กลางว่า **แต่ละ Task ในแผนต้องเรียกสกิลไหน เมื่อไร และเรียกอย่างไร**

- Spec: `docs/superpowers/specs/2026-10-14-visionquest-design.md` (rev 2)
- Plan: `docs/superpowers/plans/2026-10-14-visionquest.md` (Task 1–16)
- `CLAUDE.md` — สั่งให้ Claude เรียกสกิลอัตโนมัติตามประเภทงาน
- `.claude/commands/vq-*.md` — slash command ที่เรียกสกิลให้ทันที
- `.claude/skills/` + `skills-lock.json` — สกิลภายนอกที่ติดตั้งในโปรเจกต์แล้ว

---

## 1. สกิลตามโจทย์ (ที่กำหนดไว้)

| เกณฑ์โจทย์ | สกิล | ได้อะไร | Command | Task ในแผน |
|---|---|---|---|---|
| วางแผนทั้งหมด | `superpowers:brainstorming` → `superpowers:writing-plans` | ปิดดีไซน์ แล้วแตกเป็นแผน | `/vq-plan` | ✅ ทำแล้ว (spec rev 2 + plan) — ใช้อีกเมื่อเปลี่ยนขอบเขต |
| 1, 2, 7: หน้าตา Portfolio + Chat UI | `frontend-design` | สไตล์มีเอกลักษณ์ ไม่เป็น template | `/vq-ui` | **13** (แผนสั่ง "Read the frontend-design skill first"), 11–12 |
| 3, 4, 5: ส่วนต่าง ๆ เชื่อมกัน | `engineering:system-design` | endpoints, ตาราง, การส่ง portfolio ให้ AI | `/vq-system` | 1 (shared types), 4, 8, 9 — ใช้ตรวจ/ปรับสัญญา ไม่ต้องออกแบบใหม่ |
| 4: PostgreSQL | `data:sql-queries` | SQL ถูกต้อง | `/vq-db` | 2, 3, 4, 8 |
| 6: CI/CD | `engineering:deploy-checklist` | env vars, migrations, rollback | `/vq-deploy-check` | **14**, 16 (ก่อน seed production) |
| ภาพรวม | `engineering:testing-strategy` | กลยุทธ์ test | `/vq-test` | ทุก Task (TDD), **15** (AI eval) |
| ภาพรวม | `engineering:code-review` | รีวิวก่อนส่ง | `/vq-review` | ท้ายทุก PR + ก่อนส่งงาน (หลัง 16) |

## 2. สกิลเสริม (ติดตั้งใน `.claude/skills/`)

| เกณฑ์ | สกิล | Command | Task | หมายเหตุ |
|---|---|---|---|---|
| 2: React | `vercel-react-best-practices` | `/vq-ui`, `/vq-review` | 10–13 | แผนใช้ Vite + React 19 ไม่ใช่ Next.js — ข้ามกฎที่เป็น Server Components / Next-only |
| 1, 7: UI polish | `web-design-guidelines` | `/vq-ui-audit` | ท้าย 11, 12, **13** | ใช้คู่กับการตรวจ 360px / reduced-motion ใน Task 13 Step 4 |
| 1, 2: Components | `shadcn` | — | ไม่มี | ⚠️ **แผนไม่ได้ใช้ shadcn/ui** (Tailwind 4 + components เขียนเอง) — ติดตั้งไว้เผื่อเท่านั้น |
| 4: PostgreSQL | `supabase-postgres-best-practices` | `/vq-db`, `/vq-review` | 2, 3, 4, 8 | ใช้เฉพาะคำแนะนำ Postgres ทั่วไป; ข้าม RLS/pg_cron/pgmq/pgvector |

## 3. สกิลที่แผนต้องใช้เพิ่ม (ไม่อยู่ในรายการเดิม — มาจาก superpowers อยู่แล้ว)

| สกิล | ทำไมต้องใช้ | Command |
|---|---|---|
| `superpowers:subagent-driven-development` *(แนะนำ)* หรือ `superpowers:executing-plans` | หัวแผนระบุเป็น **REQUIRED SUB-SKILL** สำหรับลงมือทำทีละ Task | `/vq-build` |
| `superpowers:test-driven-development` | ทุก Task เป็นรูป "เขียน test ให้พัง → implement → ผ่าน" | `/vq-build`, `/vq-test` |
| `superpowers:using-git-worktrees` | แยก branch/workspace ตอนทำงานคู่ขนาน (Dev 1 web / Dev 2 api) | `/vq-build` |
| `superpowers:requesting-code-review` | รีวิวระหว่าง Task (อยู่ใน subagent-driven-development) | `/vq-build` |
| `superpowers:verification-before-completion` | ทุก Step 4 ต้องรันคำสั่งจริงก่อนบอกว่าผ่าน | `/vq-build`, `/vq-review` |
| `superpowers:finishing-a-development-branch` | `main` เป็น protected — จบ branch ด้วย PR | `/vq-review` |
| `superpowers:systematic-debugging` | เมื่อ test/CI พังแบบไม่คาดคิด | — (เรียกเองเมื่อเจอบั๊ก) |

## 4. ตาราง Task → สกิล (ตามแผน)

| Task | งาน | ผู้ทำ | สกิลที่ต้องเรียก |
|---|---|---|---|
| 1 | Monorepo, `@vq/shared`, CI job | ร่วม | TDD · system-design (สัญญา types) |
| 2 | Config, pool, migrations | Dev 2 | TDD · sql-queries · supabase-postgres-best-practices |
| 3 | Seed loader + seed files | Dev 2 | TDD · sql-queries · supabase-postgres-best-practices |
| 4 | App skeleton, `/health`, `/portfolio` | Dev 2 | TDD · system-design · sql-queries |
| 5 | Prompt builder | Dev 2 | TDD · testing-strategy |
| 6 | citations / history / title | Dev 2 | TDD |
| 7 | Gemini adapter + fallback | Dev 2 | TDD · testing-strategy (fake generate, ห้ามยิง network) |
| 8 | Conversations CRUD | Dev 2 | TDD · sql-queries · supabase-postgres-best-practices · system-design |
| 9 | POST messages SSE + rate limits | Dev 2 | TDD · system-design · code-review (security) |
| 10 | Web foundation, API client, SSE parser | Dev 1 | TDD · vercel-react-best-practices |
| 11 | Chat page | Dev 1 | TDD · vercel-react-best-practices · web-design-guidelines |
| 12 | Portfolio page | Dev 1 | TDD · vercel-react-best-practices · web-design-guidelines |
| 13 | ธีม Quest × Vision HUD | Dev 1 | **frontend-design** · vercel-react-best-practices · web-design-guidelines |
| 14 | Deploy pipeline | Dev 2 | **deploy-checklist** |
| 15 | AI eval (เกณฑ์ 5) | Dev 2 | testing-strategy |
| 16 | ข้อมูลจริง, README, demo | ทุกคน | deploy-checklist (seed prod) · **code-review** · verification-before-completion |

## 5. ติดตั้งสำหรับเพื่อนในทีม

สกิลภายนอกมากับ repo (`.claude/skills/`). ติดตั้งใหม่/อัปเดต:

```bash
npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices --skill web-design-guidelines -a claude-code -y
npx skills add supabase/agent-skills --skill supabase-postgres-best-practices -a claude-code -y
npx skills add shadcn/ui --skill shadcn -a claude-code -y   # ไม่จำเป็นตามแผนปัจจุบัน
npx skills update
```

สกิลหลักมาจาก plugin — ใน Claude Code พิมพ์ `/plugin` แล้วติดตั้ง **superpowers**, **frontend-design**, **engineering**, **data**
