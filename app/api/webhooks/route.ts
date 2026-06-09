import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, Webhook } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

/**
 * JSDoc: ตรวจสอบและบันทึก Webhooks (GET/POST /api/webhooks)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const userWebhooks = db.webhooks.filter((w) => w.user_id === user.id);

    return NextResponse.json({ data: userWebhooks });
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

    const { action, id, url, events } = await req.json();
    const db = getDb();

    if (action === 'delete') {
      db.webhooks = db.webhooks.filter((w) => !(w.id === id && w.user_id === user.id));
      saveDb(db);
      return NextResponse.json({ message: 'ลบ Webhook เรียบร้อย' });
    }

    if (action === 'toggle') {
      const wh = db.webhooks.find((w) => w.id === id && w.user_id === user.id);
      if (wh) {
        wh.isActive = !wh.isActive;
        saveDb(db);
        return NextResponse.json({ message: 'เปลี่ยนสถานะ Webhook เรียบร้อย', data: wh });
      }
      return NextResponse.json({ error: 'ไม่พบ Webhook' }, { status: 404 });
    }

    if (!url || !events || !events.length) {
      return NextResponse.json({ error: 'กรุณากรอก URL และเลือก Event อย่างน้อย 1 รายการ' }, { status: 400 });
    }

    const newWebhook: Webhook = {
      id: 'web_' + Math.random().toString(36).substr(2, 9),
      url,
      events,
      isActive: true,
      user_id: user.id,
      created_at: new Date().toISOString()
    };

    db.webhooks.push(newWebhook);
    saveDb(db);

    return NextResponse.json({ message: 'สร้าง Webhook สำเร็จ', data: newWebhook }, { status: 201 });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
