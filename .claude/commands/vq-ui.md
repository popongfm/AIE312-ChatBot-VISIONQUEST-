---
description: สร้าง/ปรับ UI (Task 11–13: Chat, Portfolio, ธีม HUD) — เกณฑ์ 1, 2, 7
argument-hint: "[หน้าหรือ component เช่น ChatPage, BBoxFrame]"
---
งาน UI: $ARGUMENTS

1. เรียกสกิล `frontend-design` — ยึดธีม "Quest × Vision HUD" (spec §6, plan Task 13): tokens `--color-void` / `--color-scan` (cyan) / `--color-quest` (amber), IBM Plex Sans Thai + IBM Plex Mono
2. เรียกสกิล `vercel-react-best-practices` — stack คือ Vite + React 19 + React Router 7 (ไม่ใช่ Next.js) ให้ข้ามกฎ Server Components/Next-only
3. ไม่ใช้ shadcn/ui ตามแผน — เรียก `shadcn` เฉพาะถ้ามี `apps/web/components.json`
4. ห้ามเปลี่ยน behavior/test ของ Task 11–12 ตอนทำธีม (Task 13 = แก้ class เท่านั้น)
5. เช็ก: `data-role` user/AI แยกชัด, ไม่มี horizontal scroll ที่ 360px, `prefers-reduced-motion`, ข้อความไทยตรงตามแผน
6. เสร็จแล้วรัน `/vq-ui-audit`
