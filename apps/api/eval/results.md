# Vision AI eval results

2026-11-12T15:32:58.494Z · remote · https://visionquest-htn7.onrender.com · **12/12 passed** (pass mark 10)

Each question is a fresh single-turn chat. `team`/`member` pass when the answer names a fact from `seed/`;
`refusal` passes when Vision says it has no data instead of guessing. Questions: `apps/api/eval/questions.json`.

| id | scope | pass |
|---|---|---|
| team-name | team | ✅ |
| team-members | team | ✅ |
| team-project | team | ✅ |
| team-contact | team | ✅ |
| popong-blood-cells | member (popong) | ✅ |
| popong-space | member (popong) | ✅ |
| natdanai-web | member (natdanai) | ✅ |
| natdanai-robot | member (natdanai) | ✅ |
| banthita-viz | member (banthita) | ✅ |
| banthita-role | member (banthita) | ✅ |
| refuse-salary | refusal | ✅ |
| refuse-weather | refusal | ✅ |

## Answers

### ✅ team-name

**Q:** ทีมนี้ชื่ออะไร และมีแนวคิดอย่างไร

**Expected:** any of "VISIONQUEST"

**A:** จากข้อมูลใน Portfolio ทีม VISIONQUEST มีรายละเอียดดังนี้ครับ:<br>* **ชื่อทีม:** VISIONQUEST<br>* **แนวคิด:** เว็บ Portfolio ของกลุ่มที่ผู้เยี่ยมชมคุยกับ AI ได้โดยตรง AI ตอบจากข้อมูลจริงของทีมและสมาชิกทุกคน และบอกได้ว่าคำตอบอ้างถึงใคร

### ✅ team-members

**Q:** ทีมมีสมาชิกกี่คน มีใครบ้าง

**Expected:** any of "แตงกวา", "บัณฑิตา"

**A:** ทีม **VISIONQUEST** มีสมาชิกทั้งหมด 3 คน ได้แก่:<br>*   **Popong Faimoon** (Lead · AI · CI/CD)<br>*   **Natdanai Chaiwongping** (Backend + Database)<br>*   **แตงกวา** หรือ **บัณฑิตา สกุลงาม** (Frontend)

### ✅ team-project

**Q:** ผลงานที่ทีมทำร่วมกันคืออะไร ใช้เทคโนโลยีอะไรบ้าง

**Expected:** any of "Gemini", "PostgreSQL"

**A:** ผลงานที่ทีม VISIONQUEST ทำร่วมกันคือ **VISIONQUEST Chat AI Portfolio** (เว็บแอป Portfolio ของกลุ่มพร้อมแชต AI ที่ตอบคำถามเกี่ยวกับทีมและสมาชิกแต่ละคนจากข้อมูลจริง)<br>**เทคโนโลยีที่ใช้:**<br>* React<br>* Express<br>* TypeScript<br>* PostgreSQL<br>* Gemini API<br>* GitHub Actions

### ✅ team-contact

**Q:** ถ้าอยากติดต่อทีม ต้องติดต่อทางไหน

**Expected:** any of "github.com/popongfm"

**A:** ช่องทางติดต่อทีม VISIONQUEST:<br>- GitHub: https://github.com/popongfm/AIE312-ChatBot-VISIONQUEST-

### ✅ popong-blood-cells

**Q:** Popong เคยทำงานตรวจจับเซลล์เม็ดเลือดไหม เปรียบเทียบโมเดลอะไรบ้าง

**Expected:** any of "Faster R-CNN"

**A:** เคยครับ ข้อมูลของ **Popong Faimoon** มีผลงานวิจัยเกี่ยวกับการตรวจจับเซลล์เม็ดเลือด ดังนี้ครับ:<br>* **โปรเจกต์**: Blood Cell Detection: YOLO vs. Faster R-CNN Benchmark (ปี 2025–2026)<br>* **การเปรียบเทียบโมเดล**: เปรียบเทียบระหว่าง YOLO 12 checkpoint กับ Faster R-CNN สำหรับตรวจจับเซลล์เม็ดเลือด 3 คลาส<br>* **ผลลัพธ์**: ได้ YOLO26m เป็นตัวที่ดีที่สุดที่ mAP50 89.2% และ F1 83.9% และพบว่าความไม่สมดุลของคลาสเป็นสาเหตุหลักของ false positive

### ✅ popong-space

**Q:** Popong มีประสบการณ์เกี่ยวกับอวกาศหรือดาวเทียมไหม

**Expected:** any of "CubeSat"

**A:** จากข้อมูลใน Portfolio ของ **Popong Faimoon** มีประสบการณ์เกี่ยวกับอวกาศและดาวเทียม ดังนี้ครับ:<br>* **Gamma-Ray Burst CubeSat Mission Concept** (การแข่งขัน GISTDA School Satellite Competition, ธันวาคม 2025):<br>* **บทบาท:** หัวหน้าทีม 5 คน<br>* **รายละเอียด:** ออกแบบภารกิจดาวเทียม CubeSat ขนาด 6U สำหรับตรวจจับ gamma-ray burst ด้วย coded aperture imaging โดยแปลงผลการค้นคว้าเป็นความต้องการของ payload ออกแบบสถาปัตยกรรมระบบ และออกแบบ payload ตัวตรวจจับ CZT (เทคโนโลยี: CubeSat 6U, CZT detector, Coded aperture imaging)

### ✅ natdanai-web

**Q:** Natdanai เคยทำเว็บไซต์อะไรมาบ้าง

**Expected:** any of "Hotel"

**A:** จากข้อมูลใน Portfolio, **Natdanai Chaiwongping** มีผลงานเว็บไซต์ดังนี้ครับ:<br>* **VISIONQUEST Chat AI Portfolio** (เว็บแอป Portfolio ของกลุ่มพร้อมแชต AI)<br>* **เทคโนโลยี:** React, Express, TypeScript, PostgreSQL, Gemini API, GitHub Actions<br>* **ส่วนที่ทำ:** Backend และฐานข้อมูล (ออกแบบตาราง PostgreSQL, migration, seed loader และ API ข้อมูล Portfolio กับประวัติแชต)<br>* **Hotel Booking Website with AI Assistant** (เว็บจองห้องพักพร้อมผู้ช่วย AI ที่ใช้ Gemini API คุยกับลูกค้าและจองห้องให้ได้)<br>* **เทคโนโลยี:** HTML, CSS, JavaScript, Gemini API, PostgreSQL (Supabase), Docker, Render<br>* **ส่วนที่ทำ:** ทำทั้ง back end และ front end (เก็บข้อมูลการจองใน PostgreSQL บน Supabase, build และ push Docker image ขึ้น Docker Hub แล้ว deploy บน Render)

### ✅ natdanai-robot

**Q:** ใครในทีมเคยควบคุมหุ่นยนต์อุตสาหกรรม

**Expected:** any of "Natdanai"

**A:** จากข้อมูลในทีม สมาชิกที่เคยควบคุมหุ่นยนต์อุตสาหกรรมคือ **Natdanai Chaiwongping**<br>* **ผลงาน:** KUKA Robot Tic-Tac-Toe Demo (หุ่นยนต์อุตสาหกรรม KUKA เล่น tic-tac-toe กับนักเรียนในงาน Open House)<br>* **หน้าที่ที่รับผิดชอบ:** เป็นผู้ควบคุมหุ่นยนต์ (ผู้ช่วยอาจารย์) คอยดูแลให้ระบบทำงานได้ปลอดภัยและต่อเนื่องตลอดงาน

### ✅ banthita-viz

**Q:** แตงกวาใช้เครื่องมืออะไรทำ data visualization

**Expected:** any of "Power BI"

**A:** จากข้อมูลของสมาชิก **แตงกวา (บัณฑิตา สกุลงาม)** เครื่องมือที่ใช้ทำ data visualization และสรุป insight คือ:<br>* **Power BI** (ใช้สร้าง Interactive Dashboard สำหรับวิเคราะห์พฤติกรรมการซื้อซ้ำและจับคู่สินค้า)

### ✅ banthita-role

**Q:** ใครรับผิดชอบหน้าเว็บ Frontend ของทีม

**Expected:** any of "แตงกวา", "บัณฑิตา"

**A:** จากข้อมูลของทีม **VISIONQUEST** สมาชิกที่รับผิดชอบส่วน Frontend ของทีม (รวมถึงหน้า Chat, หน้า Portfolio และธีม HUD) คือ **แตงกวา (บัณฑิตา สกุลงาม)** ครับ

### ✅ refuse-salary

**Q:** เงินเดือนของ Popong เท่าไหร่

**Expected:** a refusal ("ไม่มีข้อมูล")

**A:** ไม่มีข้อมูลเรื่องเงินเดือนของ Popong ครับ<br>หากสนใจ สามารถสอบถามเรื่องเกี่ยวกับทีม สมาชิก ทักษะ หรือผลงานได้เลยครับ

### ✅ refuse-weather

**Q:** สภาพอากาศพรุ่งนี้เป็นอย่างไร

**Expected:** a refusal ("ไม่มีข้อมูล")

**A:** ไม่มีข้อมูลเรื่องสภาพอากาศครับ<br>คุณสามารถสอบถามเกี่ยวกับทีม VISIONQUEST สมาชิก ทักษะ หรือผลงานของทีมได้ครับ
