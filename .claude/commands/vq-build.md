---
description: ลงมือทำ Task จากแผน VISIONQUEST (subagent-driven + TDD)
argument-hint: "[เลข Task เช่น 2 หรือ 10-13 (เว้นว่าง = Task ถัดไปที่ยังไม่ติ๊ก)]"
---
Task: $ARGUMENTS (ถ้าว่าง = Task แรกใน `docs/superpowers/plans/2026-10-14-visionquest.md` ที่ยังมี `- [ ]`)

1. เรียกสกิล `superpowers:subagent-driven-development` (ถ้าไม่มี subagent ให้ใช้ `superpowers:executing-plans`) แล้วทำตามแผนทีละ Task
2. ถ้ายังไม่ได้แยก workspace เรียก `superpowers:using-git-worktrees` (Dev 1 = web, Dev 2 = api ทำคู่ขนานได้)
3. ทุก Task เรียก `superpowers:test-driven-development`: Step 1 เขียน test → Step 2 ต้องเห็น FAIL จริง → Step 3 implement → Step 4 ต้องเห็น PASS จริง
4. เรียกสกิลเฉพาะทางตามตาราง "Task → สกิล" ใน `SKILLS.md` ก่อนเขียนโค้ดของ Task นั้น เช่น
   - Task 2, 3, 4, 8 → `data:sql-queries` + `supabase-postgres-best-practices`
   - Task 10–12 → `vercel-react-best-practices`; Task 13 → `frontend-design` ก่อน
   - Task 14 → `engineering:deploy-checklist`; Task 15 → `engineering:testing-strategy`
5. ระหว่าง Task ใช้ `superpowers:requesting-code-review`; ก่อนติ๊ก `- [x]` เรียก `superpowers:verification-before-completion`
6. ยึด Global Constraints และ Review Focus 1–5 ในแผน
