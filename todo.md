# TODO: bl1nk ink Implementation Tracker

- [x] **Phase 1: Database Engine & APIs** <!-- id: 0 -->
  - [x] ตัวขับเคลื่อนระบบเก็บข้อมูลพอร์ตเซิร์ฟเวอร์ `/lib/db.ts` พร้อม SQL-like CRUD, Event triggers และ RLS <!-- id: 1 -->
  - [x] API Auth Endpoint & Session Utility `/api/auth` (Register, Login, Me, Logout) <!-- id: 2 -->
  - [x] CRUD API Routes สำหรับ Projects, Tasks, Folders, Tags, Rules, Webhooks, API Keys, และ Trash <!-- id: 3 -->

- [x] **Phase 2: Authentication & Landing UI (`/`)** <!-- id: 4 -->
  - [x] ออกแบบ UI สไตล์ "Deep Onyx & Electric Gold" ล้ำลึก มี Dynamic Glowing Logo <!-- id: 5 -->
  - [x] ฟอร์ม Sign In, Sign Up พร้อม validation และ transition สวยงาม <!-- id: 6 -->

- [x] **Phase 3: Central Workspace Layout & Dashboard** <!-- id: 7 -->
  - [x] Responsive Sidebar พร้อมโฟลเดอร์ซ้อนกันแบบ Multi-tree structure & Tags Cloud <!-- id: 8 -->
  - [x] Integrated Navbar พร้อม Command Palette (`Cmd+K`/`Ctrl+K`) และ Quick Actions <!-- id: 9 -->
  - [x] หน้าหลัก Dashboard: Quick stats, Upcoming, My tasks, Overdue (+ update due date) และกราฟสถิติ จาก Recharts (Weekly Completion, Status distribution) <!-- id: 10 -->

- [x] **Phase 4: Workspace Multiviews & lobeditor (`/project/[id]`)** <!-- id: 11 -->
  - [x] Toolbar ด้านบน (Inline edit, Share, Export, Favorite, View Switcher) <!-- id: 12 -->
  - [x] พัฒนาชุด 5 มุมมอง ซิงค์กันทันที (<100ms):
    - Kanban view (Drag & drop) <!-- id: 13 -->
    - Grid view (Notion gallery-style) <!-- id: 14 -->
    - Timeline view (Gantt schedule) <!-- id: 15 -->
    - Fleet view (Table with search/sort/filter) <!-- id: 16 -->
    - Calendar view (Time blocks with drag & conflict alert) <!-- id: 17 -->
  - [x] หน้า Detail สไลด์ (Task / Note Detail):
    - **lobeditor**: Block-based editor รองรับ Markdown และ Block พิเศษ (`/poll`, `/chart`) <!-- id: 18 -->
    - แผงควบคุม Properties, Tag Rules (Prefix, Constraints, พิกัดโฟลเดอร์) <!-- id: 19 -->

- [x] **Phase 5: Global Settings & Developer Suite** <!-- id: 20 -->
  - [x] Settings Tabs (General, Templates, Public Profile, API Keys, Webhooks, Integrations, Extensions) <!-- id: 21 -->
  - [x] Developer Custom Extensions: ปลั๊กอิน theme CSS, Custom Block code, JavaScript worker scripts <!-- id: 22 -->
  - [x] เมนูถังขยะ Trash Management: Restore + Empty trash & Profile Settings <!-- id: 23 -->

- [x] **Phase 6: Quality Optimization & Robust Tests** <!-- id: 24 -->
  - [x] ตรวจเช็กระบบ Appointment Conflict แบบ Real-time และสกลบ RLS <!-- id: 25 -->
  - [x] จัดทำการทดสอบอัตโนมัติฝั่งแบ็คเอนด์ (API Automation Test Dashboard) ที่ `/api-tests` และ `/api/tests/run` <!-- id: 25_1 -->
  - [x] ติดตั้งและตั้งค่าเครื่องมือทดสอบหน้าจอเบราว์เซอร์จริงด้วยคลังยอดนิยม Playwright (`tests/e2e/tasks.spec.ts`, `playwright.config.ts`) <!-- id: 25_2 -->
  - [x] ทดสอบสร้างผู้ใช้ Jordan Lee ตรวจรับความปลอดภัย RLS ปิดกั้นการดูข้ามโปรเจกต์ <!-- id: 26 -->
  - [x] รัน `npm run lint` และ `npm run build` เพื่อทำให้ระบบเสถียรไร้ที่ติ (Zero Warnings) <!-- id: 27 -->

- [x] **Phase 7: Elegant Dark Theme Styling Integration** <!-- id: 28 -->
  - [x] ปลดล็อกโทนดีไซน์ลึกซึ้งผ่าน CSS `.glass-panel` ใหม่ใน `/app/globals.css` <!-- id: 29 -->
  - [x] อัปเดตเลย์เอาต์โครงสร้างหลัก Sidebar และแถบนำร่อง Header ใน `/components/WorkspaceShell.tsx` <!-- id: 30 -->
  - [x] ปรับโทนสีพื้นหลังหลักเวิร์กสเปซเป็น `#121212` และหน้าตาสถิติในแดชบอร์ด `/app/dashboard/page.tsx` <!-- id: 31 -->
  - [x] ตรวจเช็กปรับลุคบอร์ดหน้าโปรเจกต์และ Slide Drawer ใน `/app/project/[id]/page.tsx` <!-- id: 32 -->

- [x] **Phase 8: Stateful Vercel / Upstash Workflows & Step-by-step Interactive Visualizer** <!-- id: 33 -->
  - [x] ติดตั้งชุดเครื่องมือ SDK สำเร็จรูป `@upstash/workflow` และเชื่อมต่อแบบทนทาน (Durable execution) <!-- id: 34 -->
  - [x] พัฒนาแผงควบคุม UI สปีดวิเคราะห์จำลองสถานะเวิร์กโฟลว์ Step Runtime Visualizer ใน `/app/settings/page.tsx` <!-- id: 35 -->
  - [x] โหมดโครงสร้างบลูพริ้นท์จำลองการควบคุมคีย์ลับผ่าน REST Code-generator (Upstash vs. Vercel SDK) <!-- id: 36 -->

- [x] **Phase 9: Real Google Tasks & Gmail Integration Subsystems** <!-- id: 37 -->
  - [x] ปรับขยาย OAuth scopes สำหรับการยิงคำขอ Google Tasks (`tasks`) และสตรีมจดหมาย Gmail (`gmail.readonly`, `gmail.send`) <!-- id: 38 -->
  - [x] พัฒนาแผงควบคุม **Google Tasks Manager** สลับกระดานเลือกลิสต์งาน, ตรวจดูงานค้างคลาวด์ พร้อมระบบจัดส่งงานใหม่ด่วนแยกตามโครงสร้าง และระบบสลับสถานะเสร็จสิ้น (Completed) <!-- id: 39 -->
  - [x] พัฒนาอินเทอร์เฟซ **Gmail Intelligence Core** ตรวจสอบกล่องจดหมายขาเข้าจริง 8 รายการคู่ขนาน ประมวลส่งจดหมายฉบับจริงเข้ารหัส MIME Base64URL อย่างถูกต้อง <!-- id: 40 -->
  - [x] วางระบบควบคุม **User Confirmation Dialog** ในการกดทำเครื่องหมายเสร็จสิ้นงานค้างและคำสั่งส่งอีเมล เพื่อความมั่นคงปลอดภัยตามกฏนิวเคลียส RLS <!-- id: 41 -->

- [x] **Phase 10: Seamless Google Sheets, Docs, and Keep Final Core Sync** <!-- id: 42 -->
  - [x] บูรณาการระบบประสานงาน Google Sheets (Export/Import), Google Docs (Publish & Export Memo) และ Google Keep (Firestore-backed Notes) ร่วมกับความต้องการผู้ใช้และระเบียบ RLS อย่างสมบูรณ์ <!-- id: 43 -->
  - [x] ซิงโครไนซ์สิทธิ์ OAuth Scope คลาวด์สำหรับ Google Sheets, Google Docs, Google Drive และ Google Tasks เป็นผลสำเร็จ <!-- id: 44 -->

- [x] **Phase 11: Canvas Mode & Flow Automation** <!-- id: 45 -->
  - [x] พัฒนาหน้าจอ Magnetic Node Base `/canvas` สำหรับลากไอเทมจาก Google Slides, Keep มาประกอบเป็น Workflow อัตโนมัติด้วย `@xyflow/react` <!-- id: 46 -->
  - [x] จัดเก็บพิกัด Node/Edge Layout อย่างแนบแน่นใน Firestore document ฝังเป็น `canvas_data` ไปกับ Project <!-- id: 47_1 -->
  - [x] ปรับมุมมองแอปให้รองรับ Mobile-First Design และ Sticky Bottom Navigation สำหรับสมาร์ทโฟน <!-- id: 47_2 -->
  - [x] ลด Text พร่ำเพรื่อใน Dashboard (Telemetry) ทำให้แอปดูสบายตามากขึ้น <!-- id: 47_3 -->
  - [x] บูรณาการและตั้งค่า Sidebar Drawer ให้รองรับเมนูนำทางไปยังระบบ Canvas ควบคู่ได้อย่างสมบูรณ์ <!-- id: 47 -->


