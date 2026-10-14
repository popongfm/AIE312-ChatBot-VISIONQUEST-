---
description: กลยุทธ์และเขียน test (Vitest) + AI eval (Task 15)
argument-hint: "[ส่วนที่จะ test เช่น promptBuilder, messages SSE, sse.ts, eval]"
---
ส่วนที่จะ test: $ARGUMENTS

1. เรียกสกิล `engineering:testing-strategy` — test ในแต่ละ Task ของแผนคือขั้นต่ำ + Review Focus 1–5 ต้องมี pinned test
2. ตอนเขียนโค้ด เรียก `superpowers:test-driven-development` (ต้องเห็น FAIL ก่อน implement)
3. กติกาจากแผน:
   - api: supertest + Postgres 16 จริง (`TEST_DATABASE_URL`, `fileParallelism: false`, `resetDb`) + `fakeModel` — ห้ามยิง Gemini จริงใน unit/route tests
   - web: jsdom + @testing-library/react, mock `api`
   - Task 15: `npm run eval -w @vq/api` ยิงโมเดลจริง 12 คำถาม ต้องผ่าน ≥ 10/12; ถ้าไม่ผ่านให้แก้ prompt rules ไม่ใช่แก้คำถาม
4. ถ้า test พังแบบไม่คาดคิด เรียก `superpowers:systematic-debugging`
5. รันคำสั่งจริงแล้วแสดงผลก่อนบอกว่าผ่าน
