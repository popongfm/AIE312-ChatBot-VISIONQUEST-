# VISIONQUEST

เว็บ Portfolio ของทีม VISIONQUEST (AIE312 Final Project) พร้อมแชตบอท "Oracle" ที่ตอบคำถามเกี่ยวกับทีมและสมาชิกโดยอิงจากข้อมูลใน Portfolio เท่านั้น (ถ้าไม่มีข้อมูลจะบอกว่าไม่มี) ใช้ธีม "Quest × Vision HUD" เป็น monorepo แบบ npm workspaces: `apps/web` (Vite + React + Tailwind) · `apps/api` (Express + TypeScript) · `packages/shared` (`@vq/shared`) · PostgreSQL (Neon) · Gemini · deploy ด้วย GitHub Actions ไป Render + Vercel

เอกสารออกแบบ: [`docs/superpowers/specs/2026-10-14-visionquest-design.md`](docs/superpowers/specs/2026-10-14-visionquest-design.md) · แผนงาน: [`docs/superpowers/plans/2026-10-14-visionquest.md`](docs/superpowers/plans/2026-10-14-visionquest.md)

## เกณฑ์ตรวจงาน → อยู่ตรงไหน

| # | เกณฑ์ | ทำได้โดย |
|---|---|---|
| 1 | หน้า Portfolio (กลุ่ม, สมาชิก, ติดต่อ) | `apps/web` route `/` ดึงจาก `GET /api/portfolio` |
| 2 | Chat UI (React) แยกข้อความ user/AI | `apps/web` route `/chat` |
| 3 | Backend API (Express) ส่งต่อไป AI | `apps/api` |
| 4 | PostgreSQL เก็บประวัติแชต + ข้อมูล Portfolio | `apps/api/src/db/migrations/*.sql`, `seed/` |
| 5 | AI ตอบโดยอิงข้อมูล Portfolio | ส่ง Portfolio ทั้งหมดเป็น system instruction ให้ Gemini (`apps/api/src/services/promptBuilder.ts`), eval ใน `apps/api/eval/` |
| 6 | CI/CD อัตโนมัติ | `.github/workflows/pipeline.yml` (`ci → migrate → api → web → smoke`) |
| 7 | ความคิดสร้างสรรค์ | ธีม Quest × Vision HUD ใน `apps/web` |

## สถาปัตยกรรม

```
Browser ──► Vercel (apps/web: Vite + React + TS)
              │  fetch  VITE_API_URL/api/...
              ▼
           Render (apps/api: Express + TS, Node 22)
              ├──► Neon (PostgreSQL)
              └──► Google Gemini API (@google/genai)
```

```
.
├── apps/web/            Vite + React (pages/, components/, lib/)
├── apps/api/            Express (routes/, services/, db/, eval/)
├── packages/shared/     types ที่ใช้ร่วมกัน (@vq/shared)
├── seed/                team.json, members/<slug>.json (เนื้อหา Portfolio)
├── docker/initdb/       สร้าง DB visionquest_test ให้ docker compose
├── scripts/             smoke.sh, wait-for-version.sh
├── docs/deploy.md       คู่มือ deploy
└── .github/workflows/   pipeline.yml, seed-production.yml
```

## รันในเครื่อง (Local dev)

ต้องมี Node 22 (ดู `.nvmrc`), npm และ Docker

```bash
nvm use                                  # Node 22
npm ci
docker compose up -d --wait db           # Postgres 16 ที่ localhost:5432
cp apps/api/.env.example apps/api/.env   # แล้วใส่ GEMINI_API_KEY
cp apps/web/.env.example apps/web/.env
```

**การโหลด env:** ฝั่ง `apps/web` Vite อ่าน `apps/web/.env` ให้เองอัตโนมัติ แต่ฝั่ง `apps/api` **ไม่มีอะไรโหลด `.env` ให้** (ไม่มี dotenv หรือ `--env-file`; โค้ดอ่าน `process.env` ตรงๆ) ต้อง export ตัวแปรใน shell เดียวกันก่อนรันคำสั่งของ api ทุกครั้ง (`migrate`, `seed`, `dev`, `eval`):

```bash
set -a; source apps/api/.env; set +a
```

จากนั้น (ใน shell เดิม):

```bash
npm run migrate -w @vq/api    # สร้างตาราง
npm run seed -w @vq/api       # โหลด seed/ เข้า DB
npm run dev -w @vq/api        # API ที่ http://localhost:3000
```

เปิดอีก terminal:

```bash
npm run dev -w @vq/web        # เปิด http://localhost:5173
```

ฐานข้อมูลสำหรับ test (`visionquest_test`) ถูกสร้างโดย docker compose ผ่าน `docker/initdb/01-create-test-db.sql` และ `npm test` ใช้ DB นี้ (ค่าเริ่มต้น `postgres://postgres:postgres@localhost:5432/visionquest_test` หรือกำหนดเองด้วย `TEST_DATABASE_URL`) ถ้า volume ของ docker ถูกสร้างก่อนมี init script นี้ จะไม่มี DB ดังกล่าว ให้รัน `docker compose down -v` แล้ว `docker compose up -d --wait db` ใหม่ (ข้อมูลใน DB local จะหาย)

## การทดสอบ

```bash
npm test             # test ทุก workspace (ต้องมี Postgres จาก docker compose)
npm run typecheck
npm run lint
npm run build
```

**AI eval** (ถาม Gemini จริง 12 ข้อ ตรวจว่าตอบตรงข้อมูลใน seed และปฏิเสธเรื่องที่ไม่มี): ต้องมี `GEMINI_API_KEY` จริงและ DB ที่ seed แล้ว

```bash
set -a; source apps/api/.env; set +a
npm run eval -w @vq/api
```

ผลถูกเขียนที่ [`apps/api/eval/results.md`](apps/api/eval/results.md) (ไฟล์นี้จะมีหลังรัน eval จริงและ commit แล้ว) ผ่านเมื่อได้ ≥ 10/12

## แก้เนื้อหา Portfolio

- ข้อมูลทีม: `seed/team.json` · ข้อมูลสมาชิก: `seed/members/<slug>.json`
- รูป: `apps/web/public/avatars/<slug>.jpg`
- `npm run seed -w @vq/api` ลบแถวใน DB ที่ไม่มีอยู่ในไฟล์ seed (ไฟล์คือแหล่งความจริง)
- production seed ทำได้ผ่าน workflow `seed-production` เท่านั้น (Actions → seed-production → Run workflow)
- Gemini free tier อาจนำ prompt ไปปรับปรุงบริการของ Google จึงใส่เฉพาะข้อมูลที่เปิดเผยได้ใน `seed/`

## Deploy

ดูขั้นตอนตั้งค่าครั้งแรก, checklist และ rollback ที่ [`docs/deploy.md`](docs/deploy.md)

Pipeline `ci → migrate → api → web → smoke` (`.github/workflows/pipeline.yml`): `ci` (typecheck, lint, migrate, test, build) รันทุก PR และ push ส่วน `migrate`, `api` (Render deploy hook), `web` (Vercel) และ `smoke` (`scripts/smoke.sh`) รันเฉพาะ push เข้า `main` และต่อเมื่อ `ci` ผ่าน

## Team TODO ก่อน demo

- [ ] กรอกข้อมูลจริงใน `seed/` ของสมาชิกทั้ง 3 คน ลบ `TODO:` ทุกจุด (ตรวจด้วย `grep -rn "TODO:" seed/` ต้องไม่มีผลลัพธ์)
- [ ] เปลี่ยนชื่อ `member-2` / `member-3` เป็น slug จริง (ชื่อไฟล์ใน `seed/members/`) และแก้ slug ใน `team_projects[].members` ของ `seed/team.json` ให้ตรง
- [ ] เพิ่มรูป `apps/web/public/avatars/<slug>.jpg` ของทุกคน
- [ ] แก้ `apps/api/eval/questions.json` ให้ `expectAny` มาจากข้อมูลจริง
- [ ] `npm test` ผ่าน (รวม test "real seed/ folder is valid")
- [ ] รัน `npm run eval -w @vq/api` ให้ได้ ≥ 10/12 แล้ว commit `apps/api/eval/results.md`
- [ ] ตั้งค่าตาม `docs/deploy.md` ให้ครบ: Neon, Render, Vercel, GitHub secrets, protect `main`, จำกัด environment `production` ให้ใช้ได้เฉพาะ `main`
- [ ] push branch และเปิด PR (feature branch → PR → `ci` ผ่านก่อน merge)
- [ ] ถ่าย screenshot PR ที่ test พังแล้ว `ci` เป็นสีแดง (ไม่ถูก deploy)
- [ ] merge เข้า `main` แล้วรัน workflow `seed-production`
- [ ] รัน `scripts/smoke.sh $API_URL $WEB_URL` ต้อง exit 0
- [ ] ซ้อม demo: หน้า Portfolio → ถามเรื่องสมาชิก → กดชิป 📎 กลับไปที่การ์ด → ถามเรื่องนอกขอบเขตแล้วได้คำปฏิเสธ → แสดง pipeline สีเขียวและ screenshot PR สีแดง
