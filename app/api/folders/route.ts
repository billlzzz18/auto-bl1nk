import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, Folder } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

/**
 * JSDoc: บริหารจัดการโฟลเดอร์สำหรับโครงสร้าง Node (GET/POST /api/folders)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const userFolders = db.folders.filter((f) => f.user_id === user.id);

    return NextResponse.json({ data: userFolders });
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

    const { name, parent_id } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อโฟลเดอร์' }, { status: 400 });
    }

    const db = getDb();
    const folderId = 'fold_' + Math.random().toString(36).substr(2, 9);

    const newFolder: Folder = {
      id: folderId,
      name,
      parent_id: parent_id || null,
      user_id: user.id,
      created_at: new Date().toISOString()
    };

    db.folders.push(newFolder);
    saveDb(db);

    return NextResponse.json({ message: 'สร้างโฟลเดอร์สำเร็จ', data: newFolder }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
