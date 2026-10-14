# คู่มือ Deploy (Neon + Render + Vercel)

Pipeline: `ci → migrate → api → web → smoke` (ไฟล์ `.github/workflows/pipeline.yml`)
ทำงานเฉพาะ push เข้า `main` และต้องผ่าน `ci` ก่อนเสมอ ถ้า `ci` แดง job deploy จะไม่รัน

## ตั้งค่าครั้งแรก (One-time setup)

1. **Neon** — สร้างโปรเจกต์ แล้วคัดลอก `DATABASE_URL` แบบ pooled ที่มี `sslmode=require`
2. **Render** — สร้าง Web Service จาก repo
   - Build: `npm ci && npm run build -w @vq/api`
   - Start: `node apps/api/dist/server.js`
   - Env: `NODE_VERSION=22`, `DATABASE_URL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`, `WEB_ORIGIN`
   - ปิด **Auto-Deploy** แล้วคัดลอก **Deploy Hook**
3. **Vercel** — import repo โดยตั้ง Root Directory = `apps/web` และ framework = Vite
   - Env `VITE_API_URL` = URL ของ Render
   - ปิด automatic deployments ใน Git (`git.deploymentEnabled: false` ใน `vercel.json` ทำไว้แล้ว)
   - สร้าง token และรัน `vercel link` เพื่อดู org ID และ project ID
4. **GitHub** — เพิ่ม 7 secrets (ในสภาพแวดล้อม `production`): `DATABASE_URL`, `RENDER_DEPLOY_HOOK`, `API_URL`, `WEB_URL`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
   และ protect `main` (ต้องมี PR และผ่าน check `ci`)
5. รัน workflow `seed-production` หนึ่งครั้ง (Actions → seed-production → Run workflow)

## ก่อน deploy ทุกครั้ง (Before each deploy)

- [ ] `ci` เขียวบน PR
- [ ] migration เป็นแบบ additive / backward-compatible (job `migrate` รันก่อน API ตัวใหม่ขึ้น ดังนั้น API ตัวเก่าต้องยังใช้งานได้กับ schema ใหม่)
- [ ] ถ้ามี env var ใหม่ ให้อัปเดต `.env.example` และตั้งค่าใน Render / Vercel / GitHub secrets ก่อน merge
- [ ] ถ้าแก้ไฟล์ใน `seed/` ให้รีวิวก่อน แล้วค่อยรัน `seed-production` (seed ลบแถวที่ไม่อยู่ในไฟล์)

## Rollback

- **API (Render):** Dashboard → Deploys → เลือก deploy ล่าสุดที่สำเร็จก่อนหน้า → Redeploy
- **Web (Vercel):** รัน `vercel rollback` หรือ promote deployment ก่อนหน้าจาก dashboard
- **ฐานข้อมูล:** migration เป็น forward-only ห้ามแก้ migration ที่ apply แล้ว ให้เขียน migration ใหม่เพื่อแก้ไข
- **Seed:** รัน `seed-production` ซ้ำเฉพาะหลังรีวิว `seed/` แล้ว เพราะมันลบแถวที่ไม่มีในไฟล์

## เงื่อนไขที่ต้อง rollback (Rollback triggers)

- job `smoke` เป็นสีแดง
- `/api/health` ไม่ตอบ 200 หรือ `version` ไม่ตรงกับ commit หลังผ่านไป 10 นาที
- `/api/portfolio` ตอบ 503 `NOT_SEEDED`
- แชตตอบ `AI_ERROR` ทุกคำขอ
