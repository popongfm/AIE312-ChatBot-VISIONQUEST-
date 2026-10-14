---
description: ตรวจ UI ตาม Web Interface Guidelines (accessibility, UX) — เกณฑ์ 1, 7
argument-hint: "[ไฟล์หรือโฟลเดอร์ (เว้นว่าง = apps/web/src)]"
---
เป้าหมายการตรวจ: $ARGUMENTS (ถ้าว่าง = `apps/web/src`)

1. เรียกสกิล `web-design-guidelines` แล้วตรวจไฟล์เป้าหมาย
2. ตรวจเพิ่มตามแผน: `StatBar` มี `role="meter"`, MessageList `aria-live="polite"`, Composer Enter/Shift+Enter, ScanLine หายเมื่อ reduced motion
3. รายงานเป็น `file:line` เรียงจากรุนแรงสุด แยกหมวด accessibility / interaction / layout / ข้อความไทย-อังกฤษ
4. ถามก่อนแก้ ถ้ากระทบธีม HUD ที่ตั้งใจไว้
