---
description: รีวิวโค้ดก่อน merge / ก่อนส่งงาน
argument-hint: "[PR URL, branch หรือไฟล์ (เว้นว่าง = git diff main...HEAD)]"
---
สิ่งที่รีวิว: $ARGUMENTS (ถ้าว่าง = `git diff main...HEAD`)

1. เรียกสกิล `engineering:code-review` — เน้น secrets, SQL injection, CORS allow-list, rate limit + `trust proxy`, SSE headers/disconnect, raw HTML ใน react-markdown (ห้าม `rehype-raw`)
2. ถ้ามีไฟล์ใน `apps/web` → เรียก `vercel-react-best-practices`
3. ถ้ามี SQL/migration → เรียก `supabase-postgres-best-practices`
4. เทียบกับ Global Constraints, Review Focus 1–5 และ Spec coverage map ในแผน
5. เรียก `superpowers:verification-before-completion` — รัน `npm run typecheck && npm run lint && npm test && npm run build` จริง
6. จบ branch ด้วย `superpowers:finishing-a-development-branch` (PR เข้า `main` ที่ protected)
