# Deploy (Task 14)

ระบบ production: **GitHub** (โค้ด + CI/CD) → **Docker Hub** (image) → **Render** (รันเว็บ) + **Supabase** (PostgreSQL)

image เดียวมีทั้ง API (Express) และหน้าเว็บ (React ที่ build แล้ว) Express เสิร์ฟหน้าเว็บทุก path ที่ไม่ใช่ `/api`
จึงมี URL เดียว ไม่ต้องตั้ง CORS

## Pipeline (`.github/workflows/pipeline.yml`)

| Job | รันเมื่อ | ทำอะไร |
|---|---|---|
| `ci` | ทุก push และทุก PR | typecheck → lint → test (Postgres จริง) → build → build Docker image → รัน image แล้วเช็กว่า `/api/health` ตอบพร้อม commit ที่ถูกต้อง |
| `deploy` | push เข้า `main` หลัง `ci` ผ่าน | push image ขึ้น Docker Hub (`:<commit>` และ `:latest`) → `migrate` + `seed` ฐานข้อมูล Supabase → สั่ง Render deploy image ของ commit นี้ → smoke test รอจน `/api/health` บอก commit นี้ แล้วเช็ก `/api/portfolio` |

แต่ละขั้นของ `deploy` จะรันเมื่อมี secret ของขั้นนั้นแล้วเท่านั้น ระหว่างที่ยังตั้งบัญชีไม่ครบ pipeline ยังเขียวอยู่และมีคำเตือนบอกว่าขาดอะไร

migrate รันใน GitHub Actions ไม่ใช่บน Render เพราะ pre-deploy command ของ Render ใช้ได้เฉพาะแผนเสียเงิน
`seed` รันทุก deploy: แก้ไฟล์ใน `seed/` แล้ว merge ข้อมูลบนเว็บจะอัปเดตเอง (ไม่แตะประวัติแชต)

## ตั้งค่าครั้งแรก (สมาชิก 1)

### 1. Supabase
1. สร้างโปรเจกต์ (Region: Singapore) จดรหัสผ่าน DB
2. ปุ่ม **Connect** → **Session pooler** → copy URL (host `...pooler.supabase.com`, port `5432`)
3. ใส่รหัสผ่าน แล้ว**ต่อท้าย** `?uselibpqcompat=true&sslmode=require`

ห้ามใช้ Direct connection (เป็น IPv6 Render ต่อไม่ได้) และห้ามใช้ Transaction pooler port 6543 (`migrate` ใช้ advisory lock ซึ่งต้องอยู่บน connection เดียวตลอด)
ถ้าใช้ `sslmode=require` เฉยๆ ไลบรารี `pg` จะบังคับตรวจ certificate แบบเต็มและต่อไม่ผ่าน

### 2. Docker Hub
Account settings → Personal access tokens → สร้าง token สิทธิ์ **Read & Write**
ไม่ต้องสร้าง repository เอง push ครั้งแรกจะสร้าง `<username>/visionquest` ให้

### 3. GitHub secrets (Settings → Secrets and variables → Actions)
| ชื่อ | ชนิด | ค่า |
|---|---|---|
| `DOCKERHUB_USERNAME` | Secret | ชื่อผู้ใช้ Docker Hub |
| `DOCKERHUB_TOKEN` | Secret | token จากข้อ 2 |
| `DATABASE_URL` | Secret | URL จากข้อ 1 |

merge อะไรก็ได้เข้า `main` (หรือกด Re-run ของ pipeline ล่าสุดบน main) → ได้ image แรกบน Docker Hub และตารางใน Supabase

### 4. Render
1. New → **Web Service** → **Existing Image** → `docker.io/<username>/visionquest:latest`
2. Instance type: **Free**, Region: Singapore
3. Environment: `DATABASE_URL` (ค่าเดียวกับข้อ 1), `GEMINI_API_KEY`, `GEMINI_MODEL` (และ `GEMINI_FALLBACK_MODEL` ถ้ามี)
4. Settings → Health Check Path: `/api/health`
5. หลังสร้างเสร็จ copy **Deploy Hook** (Settings) และ URL ของเว็บ (`https://<ชื่อ>.onrender.com`)

### 5. GitHub อีก 2 ค่า
| ชื่อ | ชนิด | ค่า |
|---|---|---|
| `RENDER_DEPLOY_HOOK_URL` | Secret | Deploy Hook จากข้อ 4 |
| `PUBLIC_URL` | **Variable** (แท็บ Variables) | `https://<ชื่อ>.onrender.com` ไม่มี `/` ท้าย |

จากนี้ทุกครั้งที่ merge เข้า `main` จะ deploy อัตโนมัติจนจบ smoke test

## ข้อควรรู้
- Render แบบ Free หลับเมื่อไม่มีคนใช้สักพัก request แรกช้าหลายสิบวินาที **เปิดเว็บทิ้งไว้ก่อน demo**
- ลองรัน image ในเครื่อง: `docker build -t visionquest .` แล้ว `docker run --rm -p 3000:3000 --env-file apps/api/.env visionquest`
  (ใน `.env` ต้องชี้ DB ด้วย `host.docker.internal` แทน `localhost` บน Mac)
- ย้อนเวอร์ชัน: Render → Manual Deploy → ใส่ image tag ของ commit เก่า (`docker.io/<username>/visionquest:<commit>`)
