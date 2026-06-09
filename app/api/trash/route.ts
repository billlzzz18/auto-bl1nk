import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

/**
 * JSDoc: ตรวจสอบ คืนสถานะ และลบข้อมูลออกจากถังขยะแบบถาวร (GET/POST /api/trash)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const userTrash = db.trash.filter((t) => t.user_id === user.id);

    return NextResponse.json({ data: userTrash });
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
    const { action, id } = body;

    const db = getDb();

    // 1. ล้างถังขยะทั้งหมด (Empty Trash)
    if (action === 'empty_trash') {
      db.trash = db.trash.filter((t) => t.user_id !== user.id);
      saveDb(db);
      return NextResponse.json({ message: 'ล้างถังขยะเรียบร้อยแล้ว' });
    }

    const trashIndex = db.trash.findIndex((t) => t.id === id && t.user_id === user.id);
    if (trashIndex === -1) {
      return NextResponse.json({ error: 'ไม่พบรายการนี้ในถังขยะ' }, { status: 404 });
    }

    const trashItem = db.trash[trashIndex];

    // 2. ดึงคืนรายการหลัก (Restore Item)
    if (action === 'restore') {
      const { item_type, item_data } = trashItem;

      if (item_type === 'project') {
        const { project, tasks } = item_data;
        // ฟื้นโปรเจกต์
        db.projects.push(project);
        // ฟื้นงานข้างในทั้งหมด
        if (tasks && tasks.length) {
          db.tasks.push(...tasks);
        }
      } else if (item_type === 'task' || item_type === 'note') {
        db.tasks.push(item_data);
      }

      // ลบจาก trash
      db.trash.splice(trashIndex, 1);
      saveDb(db);

      return NextResponse.json({ message: 'กู้คืนข้อมูลกลับไปยังหน้าเดสก์บอร์ดปกติสำเร็จ' });
    }

    // 3. ลบแบบถาวร (Delete Permanently)
    if (action === 'delete_permanently') {
      db.trash.splice(trashIndex, 1);
      saveDb(db);
      return NextResponse.json({ message: 'ลบข้อมูลแบบถาวรเรียบร้อยแล้ว' });
    }

    return NextResponse.json({ error: 'Action not supported' }, { status: 400 });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
