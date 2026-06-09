import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, User } from '@/lib/db';
import { hashPassword, setSessionUser } from '@/lib/auth';

/**
 * JSDoc: สมัครสมาชิกบัญชีผู้ใช้ใหม่ (User Registration Endpoint)
 * รองรับการ Seed ข้อมูลเบื้องต้นเพื่ออำนวยความสะดวกให้ผู้ใช้ทดสอบระบบได้ทันที
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'รูปแบบอีเมลไม่ถูกต้อง' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'รหัสผ่านต้องยาวไม่น้อยกว่า 6 ตัวอักษร' }, { status: 400 });
    }

    const db = getDb();
    const existingUser = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      return NextResponse.json({ error: 'อีเมลนี้ถูกใช้งานไปแล้วในระบบ' }, { status: 400 });
    }

    // สร้าง ID ใหม่ให้กับผู้ใช้
    const userId = 'usr_' + Math.random().toString(36).substr(2, 9);
    const passwordHash = hashPassword(password);

    const newUser: User = {
      id: userId,
      email: email.toLowerCase(),
      passwordHash,
      name,
      bio: `Professional bl1nk workspace creator since ${new Date().getFullYear()}`,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
      google_connected: false,
      created_at: new Date().toISOString(),
    };

    // สมัครเสร็จแล้ว Seed โปรเจกต์เบื้องต้นให้ทันทีในสัดส่วน 1-ov (First Workspace)
    const seedProject = {
      id: 'proj_' + Math.random().toString(36).substr(2, 9),
      name: 'My First Space',
      description: 'ยินดีต้อนรับเข้าสู่อาณาจักรส่วนตัวของคุณ! นี่คือโปรเจกต์แรกที่คุณควบคุมได้ 100%',
      user_id: userId,
      is_favorite: true,
      sharing_settings: {
        public_access: false,
        include_subpages: false,
      },
      custom_properties: [],
      created_at: new Date().toISOString(),
    };

    // Seed ตัวอย่างงาน
    const seedTask = {
      id: 'BL1NK-201',
      title: 'เริ่มต้นสำรวจ bl1nk ink 🚀',
      project_id: seedProject.id,
      user_id: userId,
      description: 'ยินดีต้อนรับ! ลองเปลี่ยนมุมมองสลับสว่าง-มืด หรือกดเปลี่ยนหน้าจอไปมาระหว่าง Kanban, Grid, Table และ Calendar นะครับ',
      status: 'todo' as const,
      due_date: new Date().toISOString().split('T')[0],
      priority: 'high' as const,
      type: 'task' as const,
      tags: ['FirstStep', 'Welcome'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Seed 1 Tag
    const seedTag = {
      id: 'tag_welcome_' + Math.random().toString(36).substr(2, 9),
      name: 'Welcome',
      color: '#FFD700',
      user_id: userId,
    };

    db.users.push(newUser);
    db.projects.push(seedProject);
    db.tasks.push(seedTask);
    db.tags.push(seedTag);
    saveDb(db);

    // ทำการ Login ผู้ใช้ทันทีหลังสมัคร
    await setSessionUser(userId);

    return NextResponse.json({
      message: 'สมัครใช้งานเรียบร้อยแล้ว',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        avatar: newUser.avatar,
      }
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'เกิดข้อผิดพลาดภายในระบบ' }, { status: 500 });
  }
}
