import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, Tag, TagRule } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

/**
 * JSDoc: ตรวจสอบและบันทึกแท็กพ่วงกฎกำหนดขอบเขต (GET/POST /api/tags)
 * จัดการทั้งป้ายกำกับสีและกฎ Rules Engine (เช่น Restricted, Prefix และขนาดสูงสุด)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const userTags = db.tags.filter((t) => t.user_id === user.id);
    const userRules = db.tagRules.filter((r) => r.user_id === user.id);

    return NextResponse.json({ data: { tags: userTags, tagRules: userRules } });
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

    const { action, name, color, rule_type, rule_value, rule_id } = await req.json();

    const db = getDb();

    // 1. บันทึก/ลบ ป้ายแท็กสี (Tag CRUD)
    if (action === 'create_tag') {
      if (!name) return NextResponse.json({ error: 'กรุณากรอกชื่อแท็ก' }, { status: 400 });
      
      const exists = db.tags.some((t) => t.user_id === user.id && t.name.toLowerCase() === name.toLowerCase());
      if (exists) return NextResponse.json({ error: 'มีแท็กชื่อนี้อยู่แล้ว' }, { status: 400 });

      const newTag: Tag = {
        id: 'tag_' + Math.random().toString(36).substr(2, 9),
        name,
        color: color || '#FFD700',
        user_id: user.id
      };
      db.tags.push(newTag);
      saveDb(db);
      return NextResponse.json({ message: 'สร้างแท็กเรียบร้อย', data: newTag }, { status: 201 });
    }

    if (action === 'delete_tag') {
      db.tags = db.tags.filter((t) => !(t.user_id === user.id && t.name === name));
      saveDb(db);
      return NextResponse.json({ message: 'ลบแท็กเรียบร้อย' });
    }

    // 2. บันทึกและปรับแต่งค่าระบบกฎ Tag Rules Engine
    if (action === 'save_rule') {
      if (!rule_type || rule_value === undefined) {
        return NextResponse.json({ error: 'กรุณากรอกข้อมูลกฎและเงื่อนไข' }, { status: 400 });
      }

      // อัปเดตกฎหรือเพิ่มเข้าไปใหม่
      const existingRuleIndex = db.tagRules.findIndex((r) => r.user_id === user.id && r.type === rule_type);
      
      if (existingRuleIndex !== -1) {
        db.tagRules[existingRuleIndex].rule_value = rule_value;
      } else {
        const newRule: TagRule = {
          id: 'tr_' + Math.random().toString(36).substr(2, 9),
          type: rule_type,
          rule_value,
          user_id: user.id
        };
        db.tagRules.push(newRule);
      }

      saveDb(db);
      return NextResponse.json({ message: 'ปรับปรุงกฎข้อจำกัดแท็กสำเร็จ', data: db.tagRules.filter((r) => r.user_id === user.id) });
    }

    if (action === 'delete_rule') {
      db.tagRules = db.tagRules.filter((r) => !(r.id === rule_id && r.user_id === user.id));
      saveDb(db);
      return NextResponse.json({ message: 'ยกเลิกกฎข้อจำกัดแท็กเรียบร้อย', data: db.tagRules.filter((r) => r.user_id === user.id) });
    }

    return NextResponse.json({ error: 'Action not supported' }, { status: 400 });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
