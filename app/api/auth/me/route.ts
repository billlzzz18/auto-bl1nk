import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

/**
 * JSDoc: ตรวจสอบข้อมูลล็อกอินของผู้ใช้ฝั่ง Client-Side (Session Verification)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        google_connected: user.google_connected,
      }
    });

  } catch (e: any) {
    return NextResponse.json({ authenticated: false, error: e.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { google_connected } = await req.json();
    const { getDb, saveDb } = require('@/lib/db');
    const db = getDb();
    const dbUserIndex = db.users.findIndex((u: any) => u.id === user.id);
    if (dbUserIndex >= 0) {
      db.users[dbUserIndex].google_connected = !!google_connected;
      saveDb(db);
    }

    return NextResponse.json({ success: true, google_connected });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
