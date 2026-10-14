---
description: เช็กลิสต์ก่อน deploy — env vars, migrations, rollback (เกณฑ์ 6; Task 14, 16)
argument-hint: "[สิ่งที่จะ deploy (เว้นว่าง = main ปัจจุบัน)]"
---
สิ่งที่จะ deploy: $ARGUMENTS

1. เรียกสกิล `engineering:deploy-checklist`
2. Pipeline ตามแผน Task 14: `.github/workflows/pipeline.yml` jobs `ci → migrate → api → web → smoke` (deploy jobs มี `needs` และ `if: push && main`, `environment: production`) + `seed-production.yml` (workflow_dispatch)
3. ตรวจให้ครบ:
   - Render env: `NODE_VERSION=22`, `DATABASE_URL` (Neon pooled, `sslmode=require`), `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`, `WEB_ORIGIN`; Auto-Deploy **ปิด**
   - Vercel: Root `apps/web`, `VITE_API_URL`, `vercel.json` มี SPA rewrite + `"git": { "deploymentEnabled": false }`
   - GitHub Secrets 7 ตัว: `DATABASE_URL`, `RENDER_DEPLOY_HOOK`, `API_URL`, `WEB_URL`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`; `main` protected ต้องผ่าน `ci`
   - `scripts/wait-for-version.sh` รอ `/api/health.version == RENDER_GIT_COMMIT`; `scripts/smoke.sh` เช็ก health, portfolio members ≥ 1, `/chat` 200
   - migration ใหม่ย้อนกลับได้ไหม; DB ถูก seed แล้ว (ไม่งั้น `/portfolio` = 503 `NOT_SEEDED` และ smoke พัง)
   - แผน rollback: Render redeploy commit ก่อน + `vercel rollback`/promote deployment ก่อน + สิ่งที่ต้องทำกับ DB
   - หลักฐานสำหรับสไลด์: PR ที่ test พัง → `ci` แดง และไม่มี deploy job รัน
4. สรุปเป็น checklist ติ๊กได้ พร้อมจุดที่ยัง ❌
