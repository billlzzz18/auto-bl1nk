# Specification: bl1nk ink (The Intelligent Personal Operating System)

## 1. What: รายละเอียดระบบ
แอปพลิเคชันเว็บ “bl1nk ink” (The Intelligent Personal Operating System) เป็นหนึ่งในระบบบริหารจัดการงาน (Tasks), โน้ตความรู้ (Notes), ฐานข้อมูล (Databases), และเวิร์กโฟลว์ส่วนตัวที่หรูหราทรงคุณภาพที่สุด 

ระบบประกอบด้วยฟีเจอร์หลักดังนี้:
1. **Interactive Multi-View Engine (Single Source of Truth)**: ข้อมูลงานเดียวกันสามารถมองได้ 5 มิติ (Kanban, Grid, Timeline, Fleet, Calendar) การแก้ไขใดๆ ซิงค์ภายใน 100ms
2. **Flexible Schema / Folders Tree**: โฟลเดอร์ซ้อนกันได้โครงสร้างไม่จำกัด รองรับประเภทงานที่ปรับแต่งได้ (Task, Milestone, Note, Event, Habit) และ Custom properties
3. **Tag Rules Engine**: ระบบกำหนดโครงสร้างและกฎเกณฑ์การใช้แท็ก (Restricted, Prefix, Folder Tags, Length constraints, Color coding)
4. **Automations Engine**: สร้างระบบอัตโนมัติ (Trigger -> Condition -> Action) เช่น การส่ง notification, webhook, หรือเปลี่ยน assignee ไปยังแอปอื่นๆ
5. **Developer & Extension System**: รองรับระบบ Theme, Block, Worker, Dashboard widget, Custom shortcuts และ REST APIs พลัส Swagger Docs
6. **Appointment Conflicts Check**: ตรวจสอบเวลาซ้ำซ้อนของการนัดหมายประเภทที่มี start/end time ของผู้ใช้รายนั้นๆ
7. **Security, Isolation & Trash**: ระบบถังขยะนับถอยหลัง 30 วัน, ข้อมูลแยกขาดจากกันอย่างปลอดภัยผ่าน Row-Level Security (RLS) เสมือนบนเซิร์ฟเวอร์
8. **AI Integrations**: เชื่อมโยงระบบกับ Gemini (ผ่าน Next.js Server-Side และ @google/genai SDK) เพื่อวิเคราะห์สรุปงานและขยายความในการใช้งานผ่านบล็อกเนื้อหา

## 3. Elegant Dark Design Theme Upgrade: รายละเอียดงานออกแบบธีมพรีเมียม
การปรับปรุงระบบสู่ธีม "Elegant Dark" เพื่อความสมบูรณ์และพรีเมียมขั้นสุด ด้วยสไตล์ประณีตลุ่มลึกที่มีสีดำสนิท สะท้อนเส้นสายขอบและเฉดเรืองรองสีทองคำไฟฟ้า:
- **เฉดสีหลัก (Palette)**:
  - พื้นหลังหลักภายนอก/Sidebar: พื้นหลังสีหน้ากากดำสนิท `#080808` และขอบสีทองสะท้อนแสง `#FFD700/10`
  - พื้นหลังพื้นที่บอร์ดเนื้อหาภายในเวิร์กสเปซ: สีชาร์โคลพรีเมียม `#121212`
  - ชิ้นกล่ององค์ประกอบ (Cards): ปรับตัวกระจก Glassmorphism ตัวโปร่งแสง `bg-white/5` และขอบขลิบขาวบางเฉียบ `border-white/10` พร้อมมี Interactive Hover เอฟเฟ็กต์เปลี่ยนขอบเรืองรองเป็นสีทองคำ `#FFD700/30` และเงากล่องมีมิติ `shadow-[0_0_20px_rgba(255,215,0,0.1)]`
- **ปุ่มและไอคอน (Aesthetic Accents)**:
  - ปุ่มแบบนิว / สร้างด่วน: ปรับเป็นพีนูเรเดียนท์สีทองคำ `#FFD700` ตัดด้วยตัวหนังสือหรือไอคอนดำสนิท `text-black font-bold` พร้อมเงาวิเศษสะท้อนแสง `shadow-[0_0_10px_rgba(255,215,0,0.2)]` และลดลงแรงเรืองรองเม็ดขุ่นเมื่อเลื่อนผ่าน
- **ระบบตัวอักษรและแถบค้นหา (Typography & Search)**:
  - หัวข้อยึดใช้ฟอนต์ Montserrat ตัวเอียงหนาระดับพรีเมียม ผสาน Inter ในเนื้อหาส่วนประยุกต์
  - กล่องค้นหาด่วน (Search): วางพิกัดรูปทรงมนแบบไข่ไก่ (rounded-full) ดำกระจก `bg-white/5 border border-white/10` พรั่งพร้อมความยาวสะดุดตามองง่าย และตอบเปลี่ยนสีอย่างมีมิติ
