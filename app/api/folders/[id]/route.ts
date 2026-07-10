import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

/**
 * JSDoc: ลบโฟลเดอร์สำหรับโครงสร้าง Node พร้อม Cascade ความสัมพันธ์ (DELETE /api/folders/[id])
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const db = getDb();
    
    // ค้นหาและตรวจสอบโฟลเดอร์เป้าหมาย
    const folderIndex = db.folders.findIndex((f) => f.id === id && f.user_id === user.id);
    if (folderIndex === -1) {
      return NextResponse.json({ error: 'ไม่พบโฟลเดอร์ระบุ หรือคุณไม่มีสิทธิ์ในการจัดการข้อมูลนี้' }, { status: 404 });
    }

    // ลบโฟลเดอร์
    db.folders.splice(folderIndex, 1);

    // ปรับความสัมพันธ์ของโปรเจกต์ที่อยู่ภายใต้โฟลเดอร์นี้ให้กลายเป็นอิสระ (null) ดักการทำงาน Cascade
    db.projects = db.projects.map((p) => p.folder_id === id ? { ...p, folder_id: null } : p);

    // ปรับโฟลเดอร์ย่อยยกระดับขึ้นเป็นโฟลเดอร์หลัก (Root)
    db.folders = db.folders.map((f) => f.parent_id === id ? { ...f, parent_id: null } : f);

    saveDb(db);

    return NextResponse.json({ message: 'ลบโฟลเดอร์เรียบร้อยแล้ว' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
