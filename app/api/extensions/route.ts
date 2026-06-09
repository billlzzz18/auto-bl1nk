import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, Extension } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

/**
 * JSDoc: ตรวจสอบและควบคุมระบบเสริมขยายความสามารถ (GET/POST /api/extensions)
 * ปรับแต่ง Theme, Block ในลบเอดิเตอร์, ShortCut, Worker/Automation ด้วย Developer Console
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const userExtensions = db.extensions.filter((ex) => ex.user_id === user.id);

    return NextResponse.json({ data: userExtensions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, id, name, version, author, type, code } = body;

    const db = getDb();

    if (action === 'delete') {
      db.extensions = db.extensions.filter((e) => !(e.id === id && e.user_id === user.id));
      saveDb(db);
      return NextResponse.json({ message: 'ถอนการติดตั้ง Extension เรียบร้อย' });
    }

    if (action === 'toggle') {
      const ext = db.extensions.find((e) => e.id === id && e.user_id === user.id);
      if (ext) {
        ext.is_enabled = !ext.is_enabled;
        saveDb(db);
        return NextResponse.json({ message: 'ปรับปรุงสถานะการใช้งาน Extension สำเร็จ', data: ext });
      }
      return NextResponse.json({ error: 'ไม่พบ Extension' }, { status: 404 });
    }

    // ติดตั้งหรือสร้างใหม่
    if (!name || !type || !code) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลและซอร์สโค้ดของ Extension ให้ครบถ้วน' }, { status: 400 });
    }

    const newExt: Extension = {
      id: 'ext_' + Math.random().toString(36).substr(2, 9),
      name,
      version: version || '1.0.0',
      author: author || 'Developer Node',
      type,
      code,
      is_enabled: true,
      user_id: user.id
    };

    db.extensions.push(newExt);
    saveDb(db);

    return NextResponse.json({ message: 'ติดตั้งและพร้อมรัน Extension สำเร็จ!', data: newExt }, { status: 201 });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
