import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, Task, isTimeConflicting, validateAndProcessTags, triggerSystemEvents } from '@/lib/db';
import { getSessionUser, authenticateApiKey } from '@/lib/auth';

/**
 * JSDoc: บริหารจัดการงาน (GET/POST /api/tasks)
 * รองรับการกรองข้อมูลความละเอียดสูง, ค้นหาแบบ Fuzzy, การจัดเรียง, Pagination,
 * ระบบความปลอดภัย RLS, ตรวจสอบเวลาชนขัดแย้ง, และการรัน Tag Rules Engine อัตโนมัติ
 */
export async function GET(req: NextRequest) {
  try {
    let user = await getSessionUser();
    if (!user) {
      const authHeader = req.headers.get('Authorization');
      user = authenticateApiKey(authHeader);
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('project_id');
    const status = searchParams.get('status');
    const tag = searchParams.get('tag');
    const priority = searchParams.get('priority');
    const type = searchParams.get('type');
    const q = searchParams.get('q'); // Fuzzy search
    const sort = searchParams.get('sort') || '-created_at';
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);

    const db = getDb();
    let tasks = db.tasks.filter((t) => t.user_id === user.id);

    // Filter
    if (projectId) tasks = tasks.filter((t) => t.project_id === projectId);
    if (status) tasks = tasks.filter((t) => t.status === status);
    if (tag) tasks = tasks.filter((t) => t.tags.includes(tag));
    if (priority) tasks = tasks.filter((t) => t.priority === priority);
    if (type) tasks = tasks.filter((t) => t.type === type);
    if (q) {
      const lowerQ = q.toLowerCase();
      tasks = tasks.filter((t) => t.title.toLowerCase().includes(lowerQ) || t.description.toLowerCase().includes(lowerQ));
    }

    // Sort
    tasks.sort((a, b) => {
      let comparison = 0;
      if (sort.includes('due_date')) {
        const dateA = a.due_date || '9999-12-31';
        const dateB = b.due_date || '9999-12-31';
        comparison = dateA.localeCompare(dateB);
      } else if (sort.includes('priority')) {
        const pMap = { high: 3, medium: 2, low: 1 };
        comparison = pMap[b.priority] - pMap[a.priority];
      } else {
        // default by created_at
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sort.startsWith('-') ? -comparison : comparison;
    });

    // Pagination
    const total = tasks.length;
    const offset = (page - 1) * limit;
    const paginated = tasks.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginated,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let user = await getSessionUser();
    if (!user) {
      const authHeader = req.headers.get('Authorization');
      user = authenticateApiKey(authHeader);
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      title,
      project_id,
      description,
      status,
      due_date,
      start_time,
      end_time,
      priority,
      type,
      estimated_time,
      actual_time,
      parent_id,
      tags
    } = await req.json();

    if (!title || !project_id) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อหัวข้องานและระบุโปรเจกต์' }, { status: 400 });
    }

    const db = getDb();
    
    // 1. Appointment Conflict Checkingสำหรับงานแต่งตั้งเวลา (Event, Habit)
    const normalizedType = type || 'task';
    const normalizedDueDate = due_date || new Date().toISOString().split('T')[0];

    if ((normalizedType === 'event' || normalizedType === 'habit') && start_time && end_time) {
      const isConflict = isTimeConflicting(user.id, normalizedDueDate, start_time, end_time);
      if (isConflict) {
        return NextResponse.json({
          error: 'ช่วงเวลานี้ถูกจองไปแล้ว กรุณาเลือกวันที่อื่น (Appointment Conflict)'
        }, { status: 409 });
      }
    }

    // 2. Tag Rules Engine Validation
    const inTags = tags || [];
    const tagValidation = validateAndProcessTags(user.id, inTags);
    if (tagValidation.error) {
      return NextResponse.json({ error: tagValidation.error }, { status: 422 });
    }

    // สร้างไอดีอ้างอิงรหัส BL1NK-XXXX อัตโนมัติ
    const taskCount = db.tasks.length;
    const codeId = `BL1NK-${1001 + taskCount}`;

    const newTask: Task = {
      id: codeId,
      title,
      project_id,
      user_id: user.id,
      description: description || '',
      status: status || 'todo',
      due_date: normalizedDueDate,
      start_time: start_time || undefined,
      end_time: end_time || undefined,
      priority: priority || 'medium',
      type: normalizedType,
      estimated_time,
      actual_time,
      parent_id: parent_id || undefined,
      tags: tagValidation.processedTags,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.tasks.push(newTask);
    saveDb(db);

    // 3. ทริกเกอร์ Automations และ Webhooks สั่นสะเทือนเวิร์กสเปซ
    triggerSystemEvents(user.id, 'task.created', newTask);

    return NextResponse.json({ message: 'สร้างงานสำเร็จ', data: newTask }, { status: 201 });

  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
