import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb, saveDb, ApiKey } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

/**
 * JSDoc: บริหารจัดการสิทธิ์การเชื่อมต่อ API Keys สำหรับนักพัฒนา (GET/POST /api/keys)
 * ความพรีเมียม: สุ่มคีย์ความปลอดภัยสูง, ปกปิด (Masked Key) เพื่อแสดงครั้งเดียวตอนตอบกลับ
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const userKeys = db.apiKeys.filter((k) => k.user_id === user.id);

    return NextResponse.json({ data: userKeys });
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
    const db = getDb();

    if (body.action === 'delete') {
      db.apiKeys = db.apiKeys.filter((k) => !(k.id === body.id && k.user_id === user.id));
      saveDb(db);
      return NextResponse.json({ message: 'ลบ API Key เรียบร้อย' });
    }

    const name = body.name || 'New Custom Integration Cli';

    // สุ่มสร้าง API Key ที่ปลอดภัยสูง
    const randomBytes = crypto.randomBytes(18).toString('hex'); // 36 ตัวอักษร
    const rawKey = `bl1nk_sec_${randomBytes}`;
    
    // ทำหน้ากากปกปิด (Masked)
    const masked_key = `bl1nk_...${rawKey.slice(-5)}`;

    const newKeyRecord: ApiKey = {
      id: 'key_' + Math.random().toString(36).substr(2, 9),
      key: rawKey,
      masked_key,
      name,
      user_id: user.id,
      created_at: new Date().toISOString()
    };

    db.apiKeys.push(newKeyRecord);
    saveDb(db);

    return NextResponse.json({
      message: 'สร้าง API Key สำเร็จ! กรุณาคัดลอกและบันทึกคีย์นี้ทันที เพราะระบบจะแสดงคีย์นีเพียงครั้งเดียวเท่านั้น',
      data: {
        id: newKeyRecord.id,
        name: newKeyRecord.name,
        raw_key: rawKey, // แสดงแค่รอบแรกนี้รอบเดียว
        masked_key: newKeyRecord.masked_key,
        created_at: newKeyRecord.created_at
      }
    }, { status: 201 });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
