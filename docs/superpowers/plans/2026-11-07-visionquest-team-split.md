# VISIONQUEST — แผนแบ่งงาน 3 คน (Team Split Plan)

> **For agentic workers:** แผนนี้เป็นส่วนเสริมของ `plans/2026-10-14-visionquest.md` (Task 1–16) — เนื้อหา step/test ของแต่ละ Task ให้ดูในไฟล์นั้น ไฟล์นี้กำหนดเฉพาะ **ใครทำ Task ไหน, ลำดับ, และจุดส่งต่อ** ใช้ superpowers:subagent-driven-development หรือ executing-plans ต่อคน

**Goal:** แบ่ง 16 Task เป็น 3 สายที่ทำขนานกันได้ โดยมีจุดรวมงาน (integration) ชัดเจน

**Spec:** `specs/2026-10-14-visionquest-design.md` (rev 2) · **แผนหลัก:** `plans/2026-10-14-visionquest.md`

**Production (เปลี่ยน 2026-11-12):** GitHub → Docker Hub (image) → Render (เว็บ, image เดียวมีทั้ง API และหน้าเว็บ) + Supabase (PostgreSQL) แทน Neon/Vercel — รายละเอียดและขั้นตอนตั้งค่าใน `docs/deploy.md`

## Global Constraints
- สัญญา API ระหว่างสาย = `@vq/shared` (Task 1) — แก้ได้ผ่าน PR ที่สมาชิก 1 รีวิวเท่านั้น
- `main` protected, ทำงานบน feature branch → PR → ต้องผ่าน `ci` (ตามสเปก §7)
- ทุก PR ต้องมีผู้รีวิวอย่างน้อย 1 คนจากอีกสาย; สมาชิก 1 เป็นผู้ merge
- แต่ละคนดูแลไฟล์ของตัวเองเป็นหลัก (ตารางด้านล่าง) ถ้าต้องแก้ไฟล์ของสายอื่นให้แจ้งเจ้าของก่อน

## ตารางแบ่งงาน

| สมาชิก | บทบาท | Task ที่รับผิดชอบ | โฟลเดอร์/ไฟล์ที่เป็นเจ้าของ |
|---|---|---|---|
| **1 — Lead** | Overview · Main code · Supervisor | **1** scaffold/shared/CI · **5** promptBuilder · **7** Gemini adapter · **9** SSE + rate limit · **14** deploy pipeline · **15** AI eval · **16** README/รวมเนื้อหา/demo/สไลด์ | root config, `packages/shared`, `.github/`, `scripts/`, `docs/`, `services/{promptBuilder,gemini}.ts`, `routes/conversations.ts` (ส่วน POST messages), `middleware/rateLimit.ts`, `apps/api/eval/` |
| **2 — Backend + DB** | API + Postgres | **2** config/pool/migrations · **3** seed loader · **4** app skeleton, /health, /portfolio · **6** citations/history/title · **8** conversations CRUD | `apps/api/src/{config,app,server}.ts`, `db/`, `routes/{health,portfolio}.ts`, `services/{portfolioRepo,chatRepo,citations,history,title}.ts`, `middleware/{clientId,errors}.ts`, `test/helpers/`, `seed/` (โครง) |
| **3 — Frontend** | Web ทั้งหมด | **10** web foundation · **11** Chat page · **12** Portfolio page · **13** ธีม HUD | `apps/web/**` |

เหตุผล: สมาชิก 1 ถือ "หัวใจ AI" (prompt → Gemini → SSE) ซึ่งเป็นเกณฑ์ข้อ 5 และงานที่ต้องเห็นภาพรวม (CI/CD, eval, รวมงาน) · สมาชิก 2 ถือข้อมูลทั้งหมดตั้งแต่ schema ถึง endpoint · สมาชิก 3 ถือทุกอย่างที่ผู้ใช้เห็น

## จุดส่งต่อที่ต้องตกลงตั้งแต่วันแรก
1. **`ChatModel` interface** — Task 4 (สมาชิก 2) ต้องใช้ type นี้ใน `AppDeps` ก่อน Task 7 เสร็จ → สมาชิก 1 ใส่ `ChatModel`, `AiRateLimitError`, `AiError` เป็น type/class เปล่าใน `apps/api/src/services/gemini.ts` ตั้งแต่ **Task 1** เพื่อไม่ให้ Task 4 ติด
2. **Task 9 แก้ไฟล์ของ Task 8** (`routes/conversations.ts`) — สมาชิก 1 เริ่ม Task 9 หลัง Task 8 ของสมาชิก 2 merge แล้วเท่านั้น
3. **ฝั่ง web ไม่ต้องรอ API** — สมาชิก 3 mock `api` ตามที่แผนระบุ (Task 10–12 เทสต์ด้วย mock) แล้วค่อยต่อ API จริงตอนรวมงาน
4. **ข้อมูลจริงใน `seed/`** — แต่ละคนกรอกไฟล์ `seed/members/<slug>.json` + `apps/web/public/avatars/<slug>.jpg` ของตัวเอง (Task 16) สมาชิก 1 เป็นคนตรวจรวม
5. **หน้าเว็บอยู่ใน image เดียวกับ API** — สมาชิก 3: `npm run build -w @vq/web` ต้องได้ `apps/web/dist/index.html` (ค่าเริ่มต้นของ Vite), เรียก API ด้วย path แบบ relative (`/api/...`) ไม่ใส่ host, และตอน dev ใช้ Vite proxy `/api` → `http://localhost:3000`

## ลำดับและเส้นทางขนาน (กำหนดส่ง > 3 สัปดาห์)

| ช่วง | สมาชิก 1 | สมาชิก 2 | สมาชิก 3 |
|---|---|---|---|
| **สัปดาห์ 1 (วัน 1–2)** | **Task 1** (ทุกคนรอ) + เปิดบัญชี Supabase/Docker Hub/Render/Gemini key | อ่านสเปก §4–5, เตรียม docker-compose | อ่านสเปก §6, ติดตั้ง Vite/Tailwind ในเครื่อง |
| **สัปดาห์ 1 (วัน 3–7)** | **Task 5**, เริ่ม **Task 7** | **Task 2** → **Task 3** | **Task 10** |
| **สัปดาห์ 2** | จบ Task 7; Dockerfile + deploy job ของ Task 14 (เสร็จแล้ว) → ตั้งค่าบัญชีตาม `docs/deploy.md` | **Task 4** → **Task 6** → **Task 8** | **Task 11** (mock API) |
| **สัปดาห์ 3** | **Task 9** (หลัง Task 8 merge) → **Task 14** deploy จริง | ช่วยแก้ bug integration, เตรียมข้อมูลทดสอบ, รีวิว Task 9 | **Task 12** → **Task 13** |
| **สัปดาห์ 4 (buffer)** | **Task 15** eval → **Task 16** รวมเนื้อหา, ซ้อม demo, สไลด์ | กรอก seed ของตัวเอง, แก้ bug API | กรอก seed ของตัวเอง, ขัดเกลา UI/มือถือ 360px |

## Integration checkpoints (สมาชิก 1 เป็นผู้เรียกประชุม 15 นาที)
- **จบสัปดาห์ 1:** `npm test` ผ่านทั้ง monorepo, migrate + seed รันได้บน Postgres local
- **จบสัปดาห์ 2:** `GET /api/portfolio` คืนข้อมูลจริง → สมาชิก 3 ต่อหน้า Portfolio กับ API จริงได้
- **กลางสัปดาห์ 3:** แชตสตรีมจริงจาก web → API → Gemini ครบวง
- **จบสัปดาห์ 3:** pipeline `ci (test + Docker image) → push image → migrate + seed → Render deploy → smoke` เขียวบน production, มี PR ที่ test พังเพื่อถ่ายภาพลงสไลด์
- **สัปดาห์ 4:** eval ≥ 10/12, ซ้อม demo ตามเช็กลิสต์ Task 16

## Review Focus (ความเสี่ยงของการแบ่งงานนี้)
1. **สมาชิก 1 เป็นคอขวด** (Task 1 ต้องเสร็จก่อนทุกคน) → ทำ Task 1 ให้เสร็จใน 1–2 วัน, ลด scope เหลือ scaffold + types + CI ก่อน
2. **Task 9 ต้องรอ Task 8** → สมาชิก 2 ทำ Task 8 ก่อน Task 6 ได้ถ้าเห็นว่าสมาชิก 1 ว่างรอ (Task 6 เป็นฟังก์ชัน pure ไม่มีใครรอ แต่ Task 9 ใช้) — ตกลงกันที่ checkpoint สัปดาห์ 2
3. **Type ใน `@vq/shared` เปลี่ยนกลางทาง** → แก้ผ่าน PR เดียวที่สมาชิก 1 อนุมัติ และแจ้งทั้งสองสาย
4. **ข้อมูลสมาชิกไม่ครบตอน demo** → กำหนดเส้นตายกรอก seed ปลายสัปดาห์ 3 (แผนหลักรองรับ seed ไม่ครบ แต่คำตอบ AI จะบางลง)
5. **เทสต์ที่ใช้ Gemini จริงอยู่นอก CI** → สมาชิก 1 รัน `npm run eval` ด้วยมือก่อนทุก demo
