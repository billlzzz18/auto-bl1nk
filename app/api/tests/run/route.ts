import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const origin = req.nextUrl.origin;
    const testResults: any[] = [];
    const timestamp = new Date().toISOString();

    // Helper to log test outcomes
    const runTest = async (
      name: string,
      category: string,
      fn: () => Promise<{ passed: boolean; status: number; expected: string; received: string; payload?: any; details?: string }>
    ) => {
      const start = Date.now();
      try {
        const result = await fn();
        testResults.push({
          id: `TC-${category.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`,
          name,
          category,
          passed: result.passed,
          status: result.status,
          expected: result.expected,
          received: result.received,
          payload: result.payload,
          details: result.details || '',
          durationMs: Date.now() - start
        });
      } catch (err: any) {
        testResults.push({
          id: `TC-ERR-${Math.floor(Math.random() * 90) + 10}`,
          name,
          category,
          passed: false,
          status: 500,
          expected: 'Success response',
          received: err.message || 'Exception occurred',
          payload: null,
          details: err.stack || '',
          durationMs: Date.now() - start
        });
      }
    };

    // ==========================================
    // 1. AUTH REGISTER TESTS
    // ==========================================
    await runTest('สมัครสมาชิกแต่อีเมลกุญแจไม่ได้ป้อน', 'Auth Registration', async () => {
      const p = { name: 'Test Bob', password: 'password123' };
      const res = await fetch(`${origin}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      const data = await res.json();
      const passed = res.status === 400 && (data.error?.includes('กรุณา') || data.error?.includes('ครบ'));
      return {
        passed,
        status: res.status,
        expected: 'HTTP 400 (Bad Request - Missing Email)',
        received: `HTTP ${res.status}: ${JSON.stringify(data)}`,
        payload: p
      };
    });

    await runTest('สมัครสมาชิกแต่รหัสยืนยันไม่ตรงกัน', 'Auth Registration', async () => {
      const p = { name: 'Test Bob', email: 'bob@example.com', password: 'password123', confirmPassword: 'different_password' };
      // wait, let's see what is expected in register:
      // In register endpoint, does it check password === confirmPassword? Let's verify, yes.
      const res = await fetch(`${origin}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      const data = await res.json();
      const passed = res.status === 400;
      return {
        passed,
        status: res.status,
        expected: 'HTTP 400 (Bad Request - Passwords mismatch)',
        received: `HTTP ${res.status}: ${JSON.stringify(data)}`,
        payload: p
      };
    });

    await runTest('สมัครสมาชิกด้วยอีเมลซ้ำซ้อนในฐานข้อมูล', 'Auth Registration', async () => {
      const p = { name: 'Alex Copycat', email: 'alex@bl1nk.io', password: 'bl1nkOS2026' };
      const res = await fetch(`${origin}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      const data = await res.json();
      const passed = res.status === 400 && data.error?.includes('มีอยู่แล้ว');
      return {
        passed,
        status: res.status,
        expected: 'HTTP 400 (Conflict Email - User already exists)',
        received: `HTTP ${res.status}: ${JSON.stringify(data)}`,
        payload: p
      };
    });


    // ==========================================
    // 2. AUTH LOGIN TESTS
    // ==========================================
    await runTest('ล็อกอินโดยไม่มีอีเมลหรือรหัสผ่าน', 'Auth Login', async () => {
      const p = { email: '', password: '' };
      const res = await fetch(`${origin}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      const data = await res.json();
      const passed = res.status === 400 && data.error?.includes('กรุณากรอก');
      return {
        passed,
        status: res.status,
        expected: 'HTTP 400 (Bad Request - Empty payloads)',
        received: `HTTP ${res.status}: ${JSON.stringify(data)}`,
        payload: p
      };
    });

    await runTest('ล็อกอินผู้ใช้ที่ไม่มีในระบบ', 'Auth Login', async () => {
      const p = { email: 'wrong-and-fake-user-not-existing@bl1nk.io', password: 'some_password' };
      const res = await fetch(`${origin}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      const data = await res.json();
      const passed = res.status === 400 && data.error?.includes('ไม่พบ');
      return {
        passed,
        status: res.status,
        expected: 'HTTP 400 (Bad Request - Non existing account)',
        received: `HTTP ${res.status}: ${JSON.stringify(data)}`,
        payload: p
      };
    });

    await runTest('ล็อกอินผู้ใช้ด้วยรหัสผ่านผิดพลาด', 'Auth Login', async () => {
      const p = { email: 'alex@bl1nk.io', password: 'incorrect_password_1337_lol' };
      const res = await fetch(`${origin}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      const data = await res.json();
      const passed = res.status === 400 && data.error?.includes('ไม่ถูกต้อง');
      return {
        passed,
        status: res.status,
        expected: 'HTTP 400 (Bad Request - Incorrect password)',
        received: `HTTP ${res.status}: ${JSON.stringify(data)}`,
        payload: p
      };
    });

    await runTest('ล็อกอินผ่านบัญชีทดสอบที่ถูกต้องพรีเซ็ต', 'Auth Login', async () => {
      const p = { email: 'alex@bl1nk.io', password: 'bl1nkOS2026' };
      const res = await fetch(`${origin}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      const data = await res.json();
      const passed = res.status === 200 && data.user?.email === 'alex@bl1nk.io';
      return {
        passed,
        status: res.status,
        expected: 'HTTP 200 (Success login - session returned)',
        received: `HTTP ${res.status}: ${JSON.stringify(data)}`,
        payload: p
      };
    });


    // ==========================================
    // 3. TASKS AND ENDPOINT RLS/VALIDATION TESTS
    // ==========================================
    await runTest('บล็อกการดึงข้อมูลภารกิจกรณีไม่มี Session คลุม', 'Tasks API Security', async () => {
      const res = await fetch(`${origin}/api/tasks`, {
        method: 'GET',
      });
      const data = await res.json();
      const passed = res.status === 401 && data.error === 'Unauthorized';
      return {
        passed,
        status: res.status,
        expected: 'HTTP 401 (Restricted RLS - Session required)',
        received: `HTTP ${res.status}: ${JSON.stringify(data)}`
      };
    });

    await runTest('สร้างภารกิจแต่ส่งหัวข้อและไอดีสเปซเป็นว่าง', 'Tasks API Validation', async () => {
      const p = { title: '', project_id: '' };
      const res = await fetch(`${origin}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-user-id': 'alex_morgan'
        },
        body: JSON.stringify(p),
      });
      const data = await res.json();
      const passed = res.status === 400 && data.error?.includes('กรุณากรอกชื่อ');
      return {
        passed,
        status: res.status,
        expected: 'HTTP 400 (Bad Request - Missing Required Keys)',
        received: `HTTP ${res.status}: ${JSON.stringify(data)}`,
        payload: p
      };
    });

    await runTest('สร้างภารกิจและผ่าน Tag Rules Engine ฉลุย', 'Tasks API Validation', async () => {
      const p = {
        title: 'Automation Build Task Test',
        project_id: 'proj_cyber',
        priority: 'high',
        type: 'task',
        tags: ['Design', 'DEV-core'] // passes both DEV- prefix and not restricted
      };
      const res = await fetch(`${origin}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-user-id': 'alex_morgan'
        },
        body: JSON.stringify(p),
      });
      const data = await res.json();
      const passed = res.status === 201;
      return {
        passed,
        status: res.status,
        expected: 'HTTP 201 (Created Succesfully with tags compliant)',
        received: `HTTP ${res.status}: ${JSON.stringify(data)}`,
        payload: p
      };
    });

    await runTest('ปฏิเสธสร้างภารกิจเนื่องจากใช้ Restricted Tab "internal"', 'Tasks API Validation', async () => {
      const p = {
        title: 'Restricted Hack Core Test',
        project_id: 'proj_cyber',
        priority: 'low',
        type: 'task',
        tags: ['internal'] // restricted in system
      };
      const res = await fetch(`${origin}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-user-id': 'alex_morgan'
        },
        body: JSON.stringify(p),
      });
      const data = await res.json();
      const passed = res.status === 422 && data.error?.includes('ห้ามใช้');
      return {
        passed,
        status: res.status,
        expected: 'HTTP 422 (Unprocessable - Restricted Tag "internal" Used)',
        received: `HTTP ${res.status}: ${JSON.stringify(data)}`,
        payload: p
      };
    });

    await runTest('ตรวจสอบชนกันนัดทำเวลา (Appointment Conflict - Overlap)', 'Tasks Security & Rules', async () => {
      // Habit BL1NK-3001 already booked on 2026-06-02 from 06:30 to 07:00
      const p = {
        title: 'Morning Yoga Session Overlap',
        project_id: 'proj_wellness',
        due_date: '2026-06-02',
        start_time: '06:45', // overlaps with 06:30 - 07:00!
        end_time: '07:30',
        priority: 'low',
        type: 'habit',
        tags: ['Planning']
      };
      
      const res = await fetch(`${origin}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-user-id': 'alex_morgan'
        },
        body: JSON.stringify(p),
      });
      const data = await res.json();
      const passed = res.status === 409 && data.error?.includes('ช่วงเวลานี้ถูกจองไปแล้ว');
      return {
        passed,
        status: res.status,
        expected: 'HTTP 409 (Conflict - Overlapping booking slots disallowed)',
        received: `HTTP ${res.status}: ${JSON.stringify(data)}`,
        payload: p
      };
    });

    // Calculate aggregated rates
    const totalTests = testResults.length;
    const passedTests = testResults.filter((t) => t.passed).length;
    const failedTests = totalTests - passedTests;
    const passPercentage = totalTests > 0 ? Math.round((passTestsCount() / totalTests) * 100) : 100;

    function passTestsCount() {
      return passedTests;
    }

    return NextResponse.json({
      summary: {
        totalTests,
        passedTests,
        failedTests,
        passPercentage,
        timestamp,
        runner_version: 'bl1nk-api-v1.0-automation',
        status_code: failedTests === 0 ? 'STABLE' : 'REGRESSION_DETECTED'
      },
      results: testResults
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'API Analyzer failure' }, { status: 500 });
  }
}
