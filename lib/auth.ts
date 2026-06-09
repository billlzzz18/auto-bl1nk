import { cookies, headers } from 'next/headers';
import crypto from 'crypto';
import { getDb, User } from './db';

/**
 * JSDoc: ระบบการจัดการ Session และความปลอดภัย (Security Session Helper)
 * รองรับการทำ Cookie-based authentication บน Next.js Server Components และ API Routes
 */

const SESSION_COOKIE_NAME = 'bl1nk_session';

/**
 * แปลงรหัสผ่านแบบ SHA-256 เพื่อเก็บรักษาความปลอดภัยของรหัสผ่าน
 * @param password - รหัสผ่านดั้งเดิม
 */
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * ตรวจสอบความถูกต้องและดึงข้อมูลของ User ในฝั่ง Server Component หรือ API Route
 */
export async function getSessionUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    let userId = sessionCookie?.value;

    if (!userId) {
      const headerStore = await headers();
      const authHeader = headerStore.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        userId = authHeader.substring(7);
      }
      if (!userId) {
        userId = headerStore.get('x-session-user-id') || undefined;
      }
    }

    if (!userId) {
      return null;
    }
    const db = getDb();
    const user = db.users.find((u) => u.id === userId);

    return user || null;
  } catch (e) {
    return null;
  }
}

/**
 * ตั้งค่า Session Cookie เมื่อผู้ใช้ Login สำเร็จ
 * @param userId - ไอดีของผู้ใช้
 */
export async function setSessionUser(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: userId,
    httpOnly: true,
    secure: true, // บังคับ true เพื่อใช้งาน SameSite=None ใน cross-origin iframe ของ AI Studio
    sameSite: 'none', // จำเป็นเพื่อให้จำเซสชั่นล็อกอินได้ในหน้าต่างพรีวิว
    maxAge: 60 * 60 * 24 * 7, // 7 วัน
    path: '/',
  });
}

/**
 * ล้าง Session Cookie เมื่อผู้ใช้ทำการ Logout
 */
export async function clearSessionUser(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * ตรวจสอบ API Key สำหรับนักพัฒนาและบุคคลอื่นที่เข้ามาใช้ REST API
 */
export function authenticateApiKey(authHeader: string | null): User | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const key = authHeader.substring(7); // ดึงค่าหลัง Bearer
  const db = getDb();
  const apiKeyRecord = db.apiKeys.find((k) => k.key === key);
  
  if (!apiKeyRecord) {
    return null;
  }

  const user = db.users.find((u) => u.id === apiKeyRecord.user_id);
  return user || null;
}
