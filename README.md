# AIE312-ChatBot-VISIONQUEST-

เว็บ Portfolio ของกลุ่ม VISIONQUEST พร้อมแชต AI (Gemini) ที่ตอบจากข้อมูลจริงของทีม — monorepo: `apps/api` (Express + PostgreSQL), `apps/web` (React), `packages/shared` (types ร่วม)

## รันในเครื่อง
ต้องมี Node 22 และ Docker

```sh
npm install
docker compose up -d                      # PostgreSQL (dev + test database)
cp -n apps/api/.env.example apps/api/.env # -n: ไม่ทับ .env เดิม · ใส่ GEMINI_API_KEY / GEMINI_MODEL ถ้าจะใช้แชต
npm run migrate -w @vq/api
npm run seed -w @vq/api
npm run dev -w @vq/api                    # http://localhost:3000/api/health
```

## ตรวจโค้ด
```sh
npm run typecheck && npm run lint && npm test && npm run build
```

## Deploy
ทุก merge เข้า `main` deploy อัตโนมัติ: Docker Hub → Render + Supabase — ดู [`docs/deploy.md`](docs/deploy.md)
