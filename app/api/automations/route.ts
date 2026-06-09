import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, Automation } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

/**
 * JSDoc: บริหารระบบจัดการ Automations (GET/POST /api/automations)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const userAutomations = db.automations.filter((a) => a.user_id === user.id);

    return NextResponse.json({ data: userAutomations });
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

    const { action, id, project_id, trigger_event, condition_field, condition_value, action_type, action_value, isActive } = await req.json();

    const db = getDb();

    if (action === 'delete') {
      db.automations = db.automations.filter((a) => !(a.id === id && a.user_id === user.id));
      saveDb(db);
      return NextResponse.json({ message: 'ลบเวิร์กโฟลว์สำเร็จ' });
    }

    if (action === 'toggle') {
      const auto = db.automations.find((a) => a.id === id && a.user_id === user.id);
      if (auto) {
        auto.isActive = !auto.isActive;
        saveDb(db);
        return NextResponse.json({ message: 'แก้สเตตัสเรียบร้อย', data: auto });
      }
      return NextResponse.json({ error: 'ไม่พบเวิร์กโฟลว์' }, { status: 404 });
    }

    // สร้างใหม่
    if (!project_id || !trigger_event || !action_type || !action_value) {
      return NextResponse.json({ error: 'รบกวนกรอกรายละเอียดการตั้งค่า Workflow ให้ครบถ้วน' }, { status: 400 });
    }

    const newAuto: Automation = {
      id: 'auto_' + Math.random().toString(36).substr(2, 9),
      project_id,
      trigger_event,
      condition_field: condition_field || undefined,
      condition_value: condition_value || undefined,
      action_type,
      action_value,
      isActive: isActive !== undefined ? !!isActive : true,
      user_id: user.id
    };

    db.automations.push(newAuto);
    saveDb(db);

    return NextResponse.json({ message: 'สร้าง Automation Workflow สำเร็จ', data: newAuto }, { status: 201 });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
