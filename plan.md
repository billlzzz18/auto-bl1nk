# Architecture & Implementation Plan: bl1nk ink

## 1. Architecture Highlights
- **Framework**: Next.js 15+ App Router, React 19, Tailwind CSS v4, Motion for smooth momentum transitions.
- **Database Logic (`/lib/db.ts`)**: Database engine จำลอง relational schema ทำงานบน Server-Side (เก็บใน JSON/ไฟล์ หรือ SQLite เพื่อความเสถียร 100% ใน Cloud Run) รองรับ CRUD, Row-Level Isolation, Transaction แบบง่าย, และ Trigger-based system
- **Triggers & Rules Engine**: 
  - เมื่อมีการบันทึก/แก้ไข Task, ระบบจะตรวจเช็กเงื่อนไข Tag Rules (Prefix, Restricted tag, Folder inherited tags) และความขัดแย้งของตารางเวลา (conflict check)
  - หลังจากบันทึกสำเร็จ, จะเรียก Automations trigger (เปลี่ยนสเตตัส -> ส่ง webhook / notification) และส่ง webhook event ไปยัง URL ที่ลงทะเบียนไว้
- **Server-Side API Routes**:
  - `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`
  - `/api/projects`, `/api/tasks`, `/api/notes`, `/api/tags`, `/api/folders`, `/api/automations`, `/api/webhooks`, `/api/keys`, `/api/trash`, `/api/extensions`
- **Theme and Layout (Deep Onyx & Electric Gold)**:
  - สีหลัก: ถ่านเข้ม `#121212`, ดำสนิท `#080808`
  - สีเน้น: แสงทองไฟฟ้า `#FFD700`, มรกต `#50C878`, แดงกุหลาบ `#FF6B6B`
  - Typography: Montserrat สำหรับหัวข้อ, Inter สำหรับเนื้อหาภาษาไทยและอังกฤษ

## 2. Implementation Phases

### Phase 1: Storage, Auth & Utilities (The Core Engine)
- [ ] ออกแบบและสร้าง `/lib/db.ts` (ข้อมูล Seed และ CRUD สำหรับ Users, Projects, Tasks, Notes, Tags, Rules, Folders, Automations, Webhooks, API Keys, Trash, Extensions) พร้อมการจัดการ RLS อย่างเคร่งครัด
- [ ] สร้าง API Auth และ Middleware เพื่อยืนยันตัวตน (สกัด Session จาก Cookie หรือ API Key จาก Header ในลักษณะ Bearer)
- [ ] สร้างฟังก์ชันตรวจเช็ก Conflict และ Tag rules ภายใน Engine ของ Task CRUD

### Phase 2: Page 1 - Landing & Auth Screen (`/`)
- [ ] ออกแบบ Landing Page/Auth ด้วย Motion Design หรูหรา ไหลลื่น
- [ ] ฟอร์ม Sign In (Email/Password), Sign Up
- [ ] เก็บ Session ผ่าน Cookie/LocalState เพื่อให้ใช้งานในฝั่ง Client

### Phase 3: Layout & Navigation (`/dashboard` Base Components)
- [ ] สร้าง Responsive Sidebar (กับ Drawer ของมือถือ), Navbar (พร้อม fuzzy command palette ค้นหาอัจฉริยะ)
- [ ] Dashboard Page: ยอด Quick Stats 4 ตัว, ดึงข้อมูล Upcoming, My Tasks, Overdue Tasks (มีปุ่มแก้ไขด่วน), กราฟการทำงาน (Weekly, Status, Tags) ด้วย D3 หรือ Recharts
- [ ] Quick Action Modal สำหรับ New Task/Project/Note โดยตรง

### Phase 4: Page 2 - Project Workspace & Single Source of Truth (`/project/[id]`)
- [ ] ออกแบบ top toolbar (ชื่อ Inline edit, Favourite, Share, Export)
- [ ] สร้างระบบ Sync ข้อมูล 100ms สลับ 5 มุมมองหลัก:
  1. **Kanban**: ข้ามสเตจ ลากและย้ายคอลัมน์
  2. **Grid**: รายงานสไตล์ Notion Gallery
  3. **Timeline**: แสดงงานและการขึ้นต่อกันตามแนวตั้ง/นอน
  4. **Fleet (Table)**: ตารางรายการละเอียดพร้อม batch actions
  5. **Calendar**: คัดเลือกและตั้งตารางเวลา ไม่ซ้ำซ้อน
- [ ] หน้าต่าง Task/Note Detail (Slide-over panel หรือ Modal) พร้อม **lobeditor (Block-based Editor)** รองรับ Markdown, Checklist, Code block, Custom properties และ Tag Rules Control Panel

### Phase 5: Page 3 - Integration, Settings & Public Profile (`/settings`)
- [ ] Tab General, Templates, Public Profile & Sharing Defaults
- [ ] Tab API & Webhooks: การทำ API Keys, Webhook triggers, และการจำลองระบบ Swagger API Docs
- [ ] Tab Extensions & MCP: ติดตั้ง Theme, Custom Block, Script Workers, Dashboard Widget ด้วย Console เพื่อนักพัฒนา
- [ ] ส่วนของ Trash และ My Profile

### Phase 6: Validation & Verification
- [ ] ตรวจเช็ก lint, compile และเขียน Test scenario จำลอง
- [ ] ตรวจสอบว่า Responsive UI ดูดีเลิศบนมือถือ (Mobile-first UX) และประณีตบน Desktop
- [ ] สรุปผลงาน

### Phase 7: Elegant Dark Theme Styling Integration
- [ ] **ปรับแต่งสไตล์ CSS ส่วนกลาง (`/app/globals.css`)**: ปรับปรุงคลาส `.glass-panel` และ `.glass-panel-heavy` ให้สวยหรูสะกดตามสเปก โดยใช้ `bg-white/5` และ `border border-white/10` และมี interactive hover นุ่มละมุน
- [ ] **อัปเดตแกนเลย์เอาต์หลักเวิร์กสเปซ (`/components/WorkspaceShell.tsx`)**:
  - ปรับพื้นหลังหลักของ Sidebar เป็นสีดำสนิท `#080808` และขอบฝั่งขวาเป็นขอบสีทองเรืองแสงบางเบา `border-r border-[#FFD700]/10` (ขนาดช่องไฟ Padding ช่องละ `p-5`)
  - โครงหน้ากากโลโก้ "bl1nk ink" ดึงดูดสายตาด้วยสีทองคำสว่างและเงาเรขาคณิต `shadow-[0_0_15px_rgba(255,215,0,0.4)]` กลางกล่องเป็นสี่เหลี่ยมดำ
  - ปรับปรุงแถบตัวนำหลัก (Navbar / Header) สูง `h-16 px-8 bg-[#080808]/50 backdrop-blur-md border-b border-[#FFD700]/10`
  - ปรับดีไซน์กล่อง Search หลักเป็นแบบโค้งมนสวยประณีต `rounded-full px-4 py-1.5 w-96 text-sm bg-white/5 border border-white/10 text-gray-400`
  - ยกระดับปุ่มไอคอน "+ Create" ใน Header เป็นรูปทรงทองคำเลิศหรู `bg-[#FFD700] hover:bg-[#FFC000] text-black font-bold text-sm px-4 py-1.5 rounded-md shadow-[0_0_10px_rgba(255,215,0,0.2)]`
  - ปรับสีแท็กสีสะกด Sidebar Active ให้ขึ้นฝั่งขวาโดดเด่นด้วย `text-[#FFD700] bg-[#FFD700]/5 border-r-2 border-[#FFD700]`
- [ ] **จัดระเบียบหน้าบอร์ดหน้าหลัก แดชบอร์ดเวิร์กสเปซ (`/app/dashboard/page.tsx`)**:
  - เปลี่ยนพื้นผิวส่วนหลัก (Content Wrapper) ในหน้าแรกหรือรอบนอกในเลย์เอาต์ย่อยให้เป็นสีดาร์กพรีเมียม `#121212`
  - จัดระเบียบการจัดวางและตกแต่งฟอนต์หัวเรื่องให้เป็น `font-['Montserrat'] font-extrabold` และสีกล่องสถิติสอดลื่นละมุนตา
- [ ] **ทดสอบระบบและสกัดจุดบกพร่อง (Verification Check)**: รัน `npm run lint` และ `npm run build` เพื่อให้โปรเจกต์คงเสถียรภาพระดับ Zero Warnings
