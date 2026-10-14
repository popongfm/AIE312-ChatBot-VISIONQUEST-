---
description: ตรวจ/ปรับการเชื่อมระบบ — API, ตาราง, portfolio → Gemini (เกณฑ์ 3, 4, 5; Task 1, 4, 8, 9)
argument-hint: "[ส่วนที่ต้องดู เช่น conversations API, promptBuilder, @vq/shared]"
---
ส่วนที่ดู: $ARGUMENTS

1. เรียกสกิล `engineering:system-design`
2. ดีไซน์ถูกตัดสินแล้วใน spec rev 2 §3–§5 และ Interfaces ของแผน — ใช้สกิลนี้เพื่อตรวจความสอดคล้องหรือปรับเมื่อจำเป็น ไม่ออกแบบใหม่
3. ตรวจ: `@vq/shared` types ตรงกันทั้ง web/api, `X-Client-Id` header, 404 rules, SSE wire format `event:/data:`, `ChatModel` interface, cache portfolio 60s → `buildSystemInstruction`
4. ถ้าต้องเปลี่ยนสัญญา ให้แก้ทั้ง Interfaces ในแผนและ `packages/shared` พร้อมกัน แล้วแจ้งทั้ง Dev 1 และ Dev 2
