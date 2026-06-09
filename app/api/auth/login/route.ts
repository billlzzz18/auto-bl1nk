import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword, setSessionUser } from '@/lib/auth';

/**
 * JSDoc: ลงชื่อเข้าสู่ระบบ (User Login Endpoint)
 * รองรับการเปรียบเทียบรหัสผ่านที่ทำ Hash และสร้าง HttpOnly Cookie Session
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' }, { status: 400 });
    }

    const db = getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return NextResponse.json({ error: 'ไม่พบบัญชีผู้ใช้ในระบบ หรืออีเมลไม่ถูกต้อง' }, { status: 400 });
    }

    const inputHash = hashPassword(password);
    if (user.passwordHash !== inputHash) {
      return NextResponse.json({ error: 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' }, { status: 400 });
    }

    // เซ็ต Session Cookie
    await setSessionUser(user.id);

    return NextResponse.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
      },
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'เกิดข้อผิดพลาดภายในระบบ' }, { status: 500 });
  }
}
