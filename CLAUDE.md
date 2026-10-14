# VISIONQUEST (AIE312 Final) — คำสั่งสำหรับ Claude

Portfolio + AI Chatbot: npm-workspaces monorepo — `apps/web` (Vite + React 19 + Tailwind 4) · `apps/api` (Express 5 + TS, tsup) · `packages/shared` (`@vq/shared`) · Neon Postgres · Gemini · GitHub Actions `pipeline.yml` → Render + Vercel.

- Spec: `docs/superpowers/specs/2026-10-14-visionquest-design.md` (rev 2)
- Plan: `docs/superpowers/plans/2026-10-14-visionquest.md` — ทำตาม Task 1–16 และ Global Constraints ในแผน ถ้าขัดกันให้ถามก่อน
- สกิลทั้งหมด: `SKILLS.md`

## กฎการเรียกสกิล (บังคับ)

ก่อนเริ่มงานประเภทใดต่อไปนี้ **ต้องเรียกสกิลด้วย Skill tool ก่อน** แล้วทำตามสกิล:

| งาน | เรียกสกิล |
|---|---|
| ลงมือทำ Task จากแผน | `superpowers:subagent-driven-development` (หรือ `superpowers:executing-plans`) + `superpowers:test-driven-development` |
| เปลี่ยนขอบเขต / ฟีเจอร์ใหม่นอกแผน | `superpowers:brainstorming` → `superpowers:writing-plans` |
| UI หน้า Portfolio / Chat / ธีม HUD (Task 11–13) | `frontend-design` + `vercel-react-best-practices` (ข้ามกฎเฉพาะ Next.js) |
| ตรวจ UI, accessibility, 360px | `web-design-guidelines` |
| API, data flow, สัญญา `@vq/shared`, prompt (Task 1, 4, 8, 9) | `engineering:system-design` |
| SQL, migrations, seed, repo queries (Task 2, 3, 4, 8) | `data:sql-queries` + `supabase-postgres-best-practices` |
| CI/CD, deploy, env, rollback (Task 14, 16) | `engineering:deploy-checklist` |
| วาง test / AI eval (Task 15) | `engineering:testing-strategy` |
| test พัง / บั๊ก | `superpowers:systematic-debugging` |
| ก่อน merge PR / ก่อนส่งงาน | `engineering:code-review` → `superpowers:verification-before-completion` → `superpowers:finishing-a-development-branch` |

ไม่ใช้ `shadcn` เว้นแต่ทีมตัดสินใจเพิ่ม shadcn/ui (มี `apps/web/components.json`)
ถ้าสกิลใดไม่มีในเครื่อง ให้แจ้งผู้ใช้และชี้ไปที่ส่วน "ติดตั้ง" ใน `SKILLS.md`

## ข้อกำหนดที่ต้องรักษา (ย่อจาก Global Constraints ของแผน)
- Node 22, TS strict, Postgres 16; SSL เฉพาะเมื่อ `DATABASE_URL` มี `sslmode=require`
- `clientId` ส่งผ่าน header `X-Client-Id` เท่านั้น; rate limit 10/นาที/client + 60/นาที/IP เฉพาะ POST messages
- error JSON: `{ error: { code, message } }`; ข้อความ UI ภาษาไทยต้องตรงตามแผนทุกตัวอักษร
- AI ตอบจาก `<portfolio>` เท่านั้น; ไม่มีข้อมูลต้องบอกว่าไม่มี
- ห้าม hard-code ชื่อโมเดล Gemini; ห้าม commit secrets; ทุก workspace ที่อ่าน env มี `.env.example`
- `main` protected: feature branch → PR → `ci` ผ่านก่อน merge
- Web ใช้ได้ที่ 360px และเคารพ `prefers-reduced-motion`
