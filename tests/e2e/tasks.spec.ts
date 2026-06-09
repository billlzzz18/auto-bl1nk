import { test, expect } from '@playwright/test';

/**
 * JSDoc: ชุดวิเคราะห์ทดสอบอัตโนมัติ (Visual Playwright E2E Test Suite)
 * เพื่อคอยดักตรวจจับพฤติกรรมผู้ใช้งาน และป้องกันความเสถียรของหน้าจอ (Regression Prevention)
 */

test.describe('สัญจรพฤติกรรมผู้ใช้ระบบ bl1nk ink - User Onboarding Journey', () => {

  test.beforeEach(async ({ page }) => {
    // เดินทางไปฐานหน้าแรกของเซิร์ฟเวอร์ก่อนเริ่มทำการเทส
    await page.goto('/');
  });

  test('การยืนยันตัวตนและการตรวจจับความผิดพลาด (Authentication Failures)', async ({ page }) => {
    const title = page.locator('h1');
    await expect(title).toBeVisible();

    // ขั้นที่ 1: ลงทะเบียนด้วยพาสเวิร์ดไม่สอดคล้องกันเพื่อตรวจเช็ก Glow Alert
    await page.click('text=Sign Up');
    await page.fill('input[placeholder="Full Name (ชื่อ-นามสกุล)"]', 'Jordan QA Tester');
    await page.fill('input[name="email"]', 'qatester@bl1nk.io');
    await page.fill('input[placeholder="Create security password"]', 'password_123');
    await page.fill('input[placeholder="Re-enter password"]', 'different_password');
    await page.click('button:has-text("ลงทะเบียน")');

    // ระบบต้องตรวจพบข้อความแจ้งเตือนข้อผิดพลาด
    const errorAlert = page.locator('text=รหัสผ่านไม่ตรงกัน');
    await expect(errorAlert).toBeVisible();
  });

  test('การสัญจรเข้าสู่ Dashboard และเลือกเมนูนำทาง RLS', async ({ page }) => {
    // ขั้นที่ 1: ล็อกอินด้วยเซสชันผู้ใช้องค์กรพรีเซ็ต
    await page.fill('input[name="email"]', 'alex@bl1nk.io');
    await page.fill('input[type="password"]', 'bl1nkOS2026');
    await page.click('button:has-text("เข้าสู่ระบบ")');

    // ตรวจสอบว่าระบบนำทางเปลี่ยนสถานะไปยัง Dashboard สำเร็จ
    await expect(page).toHaveURL(/.*dashboard/);

    // ตรวจสอบความปลอดภัยและกราฟ Recharts
    const statsCard = page.locator('text=Total active projects');
    await expect(statsCard).toBeVisible();
  });

  test('การตรวจสอบเส้นตาราง (UX Table Lines) และระบบ Nested Subtask', async ({ page }) => {
    // จำลองการข้ามขั้นตอนไปยังหน้าพอร์ตโปรเจกต์เฉพาะ
    await page.goto('/project/proj_cyber');

    // ตรวจสอบโครงสร้างตาราง Fleet Table
    const tableContainer = page.locator('#fleet-table-container');
    await expect(tableContainer).toBeVisible();

    // ตรวจสอบเส้นตาราง (Table Borders) เพื่อความสวยงามของ UX
    const mainTable = page.locator('table');
    await expect(mainTable).toHaveClass(/border-collapse/);

    // ตรวจสอบคอลัมน์สำคัญ เช่นลำดับสายสัมพันธ์ Hierarchy ของ Subtask
    const firstRowHeader = page.locator('text=Task Hierarchy Nodes');
    await expect(firstRowHeader).toBeVisible();
  });

  test('การเข้าสู่อุปกรณ์ Sandbox ตรวจสอบเบื้องหลังของ API Endpoints', async ({ page }) => {
    // กดสัญจรเข้าสู่ API Tester Suite
    await page.goto('/api-tests');

    // ตรวจสอบว่าระบบได้ยิง Auto loading suite เรียบร้อยดี
    const statHeader = page.locator('text=Unit & REST API Endpoint Automation Test');
    await expect(statHeader).toBeVisible();

    // ทริกเกอร์รันชุดวิเคราะห์
    await page.click('text=Run Automation Suite');
    
    // ตรวจหาตัวอักษรอัตราความคลาดเคลื่อนและ Log terminal
    const successRateBox = page.locator('text=Success Rate');
    await expect(successRateBox).toBeVisible();
  });

});
