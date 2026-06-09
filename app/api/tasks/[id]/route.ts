import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, Task, isTimeConflicting, validateAndProcessTags, triggerSystemEvents, TrashItem } from '@/lib/db';
import { getSessionUser, authenticateApiKey } from '@/lib/auth';

/**
 * JSDoc: บริหารรายละเอียดงานรายชิ้น (GET/PUT/DELETE /api/tasks/[id])
 * ทำ RLS, ตรวจสอบความสอดคล้องตารางงาน, ตรวจสอบ Tag Rules, ส่งสัญญาณ Automation เหตุการณ์
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

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const task = db.tasks.find((t) => t.id === id);

    if (!task) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลงาน' }, { status: 404 });
    }

    if (task.user_id !== user.id) {
      return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
    }

    return NextResponse.json({ data: task });

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
    const taskIndex = db.tasks.findIndex((t) => t.id === id);

    if (taskIndex === -1) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลงาน' }, { status: 404 });
    }

    const task = db.tasks[taskIndex];
    if (task.user_id !== user.id) {
      return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
    }

    const body = await req.json();

    // 1. ตรวจสอบการนัดหมายชนซ้อนกรณีอัปเดตวัน/เวลา
    const nType = body.type !== undefined ? body.type : task.type;
    const nDueDate = body.due_date !== undefined ? body.due_date : task.due_date;
    const nStart = body.start_time !== undefined ? body.start_time : task.start_time;
    const nEnd = body.end_time !== undefined ? body.end_time : task.end_time;

    if ((nType === 'event' || nType === 'habit') && nStart && nEnd) {
      const isConflict = isTimeConflicting(user.id, nDueDate, nStart, nEnd, id);
      if (isConflict) {
        return NextResponse.json({
          error: 'ช่วงเวลานี้ถูกจองไปแล้ว กรุณาเลือกวันที่อื่น (Appointment Conflict)'
        }, { status: 409 });
      }
    }

    // 2. ตรวจสอบ Tag Rules Engine
    if (body.tags !== undefined) {
      const tagValidation = validateAndProcessTags(user.id, body.tags);
      if (tagValidation.error) {
        return NextResponse.json({ error: tagValidation.error }, { status: 422 });
      }
      task.tags = tagValidation.processedTags;
    }

    // ทำบันทึกการเปลี่ยนสเตตัสเพื่อยิง Automation
    const oldStatus = task.status;

    if (body.title !== undefined) task.title = body.title;
    if (body.description !== undefined) task.description = body.description;
    if (body.status !== undefined) task.status = body.status;
    if (body.due_date !== undefined) task.due_date = body.due_date;
    if (body.start_time !== undefined) task.start_time = body.start_time || undefined;
    if (body.end_time !== undefined) task.end_time = body.end_time || undefined;
    if (body.priority !== undefined) task.priority = body.priority;
    if (body.type !== undefined) task.type = body.type;
    if (body.estimated_time !== undefined) task.estimated_time = body.estimated_time;
    if (body.actual_time !== undefined) task.actual_time = body.actual_time;
    if (body.parent_id !== undefined) task.parent_id = body.parent_id || undefined;

    task.updated_at = new Date().toISOString();
    saveDb(db);

    // 3. ยิง Event triggers
    if (oldStatus !== task.status) {
      if (task.status === 'done') {
        triggerSystemEvents(user.id, 'task.completed', task);
      } else {
        triggerSystemEvents(user.id, 'task.updated', task);
      }
    } else {
      triggerSystemEvents(user.id, 'task.updated', task);
    }

    return NextResponse.json({ message: 'อัปเดตงานเสร็จสิ้น', data: task });

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
    const taskIndex = db.tasks.findIndex((t) => t.id === id);

    if (taskIndex === -1) {
      return NextResponse.json({ error: 'ไม่พบงาน' }, { status: 404 });
    }

    const task = db.tasks[taskIndex];
    if (task.user_id !== user.id) {
      return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
    }

    // ย้ายไป Trash
    const trashItem: TrashItem = {
      id: 'trash_' + Math.random().toString(36).substr(2, 9),
      item_type: 'task',
      item_id: task.id,
      item_data: task,
      deleted_at: new Date().toISOString(),
      user_id: user.id
    };

    db.tasks.splice(taskIndex, 1);
    db.trash.push(trashItem);
    saveDb(db);

    triggerSystemEvents(user.id, 'task.deleted', task);

    return NextResponse.json({ message: 'ย้ายลงถังขยะเรียบร้อย' });

  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal Error' }, { status: 500 });
  }
}
