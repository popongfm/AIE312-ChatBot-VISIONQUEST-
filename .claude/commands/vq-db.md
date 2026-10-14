---
description: SQL / migration / seed / repo queries สำหรับ PostgreSQL (เกณฑ์ 4; Task 2, 3, 4, 8)
argument-hint: "[งาน DB เช่น 001_init.sql, applySeed, getPortfolio, chatRepo]"
---
งาน DB: $ARGUMENTS

1. เรียกสกิล `data:sql-queries` — dialect PostgreSQL 16 (CI/local) / Neon (production)
2. เรียกสกิล `supabase-postgres-best-practices` — ใช้คำแนะนำ Postgres ทั่วไป (schema, types, index, migration, query); ข้ามส่วนเฉพาะ Supabase (RLS, pg_cron, pgmq, pgvector)
3. ยึดแผน:
   - Task 2: `001_init.sql` = schema spec §4.1–4.2 + `schema_migrations` + `pgcrypto` + 2 indexes; แต่ละไฟล์รันใน transaction ของตัวเอง
   - Task 3: `applySeed` ใน transaction เดียว, upsert ตาม slug/name/title, ลบของที่ไม่อยู่ในไฟล์
   - Task 4: `getPortfolio` = 4 query เล็ก (ไม่ทำ JSON aggregation ก้อนเดียว)
   - Task 8: BIGSERIAL → `Number()`, ตรวจ UUID ก่อน query
4. ทุก query parameterized (`$1`, `$2`) ผ่าน `pg` — ห้ามต่อ string
