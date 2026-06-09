import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, TrashItem } from '@/lib/db';
import { getSessionUser, authenticateApiKey } from '@/lib/auth';

/**
 * JSDoc: จัดการรายโปรเจกต์ (GET/PUT/DELETE /api/projects/[id])
 * ตรวจเช็ก RLS แยกระดับ Row Level หากไม่ใช่เจ้าของและไม่ได้แชร์ Public -> Access Denied (403)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let user = await getSessionUser();
    if (!user) {
      const authHeader = req.headers.get('Authorization');
      user = authenticateApiKey(authHeader);
    }

    const db = getDb();
    const project = db.projects.find((p) => p.id === id);

    if (!project) {
      return NextResponse.json({ error: 'ไม่พบโปรเจกต์' }, { status: 404 });
    }

    // เช็กขอบเขต RLS
    const isOwner = user && project.user_id === user.id;
    const isPublic = project.sharing_settings?.public_access;

    if (!isOwner && !isPublic) {
      return NextResponse.json({ error: 'Access Denied: คุณไม่มีสิทธิ์เข้าถึงเนื้อหานี้' }, { status: 403 });
    }

    return NextResponse.json({ data: project });

  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal Error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let user = await getSessionUser();
    if (!user) {
      const authHeader = req.headers.get('Authorization');
      user = authenticateApiKey(authHeader);
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const projectIndex = db.projects.findIndex((p) => p.id === id);

    if (projectIndex === -1) {
      return NextResponse.json({ error: 'ไม่พบโปรเจกต์' }, { status: 404 });
    }

    const project = db.projects[projectIndex];

    // ต้องเป็นเจ้าของเท่านั้น
    if (project.user_id !== user.id) {
      return NextResponse.json({ error: 'Access Denied: คุณไม่มีสิทธิ์แก้ไขโปรเจกต์นี้' }, { status: 403 });
    }

    const body = await req.json();

    // ทำการอัปเดตค่าฟิลด์
    if (body.name !== undefined) project.name = body.name;
    if (body.description !== undefined) project.description = body.description;
    if (body.is_favorite !== undefined) project.is_favorite = !!body.is_favorite;
    if (body.sharing_settings !== undefined) {
      project.sharing_settings = {
        ...project.sharing_settings,
        ...body.sharing_settings,
      };
    }
    if (body.custom_properties !== undefined) project.custom_properties = body.custom_properties;

    saveDb(db);

    return NextResponse.json({ message: 'อัปเดตโปรเจกต์สำเร็จ', data: project });

  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const projectIndex = db.projects.findIndex((p) => p.id === id);

    if (projectIndex === -1) {
      return NextResponse.json({ error: 'ไม่พบโปรเจกต์' }, { status: 404 });
    }

    const project = db.projects[projectIndex];

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
    }

    // ย้ายโปรเจกต์ไป Trash
    const trashItem: TrashItem = {
      id: 'trash_' + Math.random().toString(36).substr(2, 9),
      item_type: 'project',
      item_id: project.id,
      item_data: project,
      deleted_at: new Date().toISOString(),
      user_id: user.id
    };

    // ลบโปรเจกต์ออกจากรายการหลัก
    db.projects.splice(projectIndex, 1);

    // ดึงงานในโปรเจกต์และลบ หรือ ยื่นลบไปด้วย
    const projectTasks = db.tasks.filter((t) => t.project_id === id);
    db.tasks = db.tasks.filter((t) => t.project_id !== id);

    // บันทึก tasks ของโปรเจกต์ควบคู่ยัดลง TrashItem ยาม Restore จะได้ฟื้นคืนถ้วนหน้า
    trashItem.item_data = {
      project,
      tasks: projectTasks
    };

    db.trash.push(trashItem);
    saveDb(db);

    return NextResponse.json({ message: 'ย้ายโปรเจกต์และงานที่เกี่ยวข้องลงถังขยะเรียบร้อย' });

  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal Error' }, { status: 500 });
  }
}
