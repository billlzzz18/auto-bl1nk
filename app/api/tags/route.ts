import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { and, desc, eq, ilike } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { getSessionUser } from "@/lib/auth";
import { tag, tagRule } from "@/lib/db/schema";
import { toTag, toTagRule } from "@/lib/db/orm";
import { errorResponse, successResponse, createdResponse, getUserItems, deleteUserItem, validateInput } from "@/lib/api-helpers";
import { createTagSchema } from "@/lib/validation";

/**
 * JSDoc: ตรวจสอบและบันทึกแท็กพ่วงกฎกำหนดขอบเขต (GET/POST /api/tags)
 * จัดการทั้งป้ายกำกับสีและกฎ Rules Engine (เช่น Restricted, Prefix และขนาดสูงสุด)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const db = getDb();
    const userTags = await getUserItems(db, tag, user.id, toTag);
    const userRules = await getUserItems(db, tagRule, user.id, toTagRule);

    return successResponse({ tags: userTags, tagRules: userRules });
  } catch (e: any) {
    return errorResponse(e.message);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { action, name, color, rule_type, rule_value, rule_id } =
      await req.json();

    const db = getDb();

    if (action === "create_tag") {
      const tagValidation = validateInput(createTagSchema, { name, color });
      if (tagValidation.error) {
        return errorResponse(tagValidation.error, 400);
      }

      const { name: validName, color: validColor } = tagValidation.data!;
      const [exists] = await db
        .select()
        .from(tag)
        .where(and(eq(tag.userId, user.id), ilike(tag.name, validName)))
        .limit(1);
      if (exists) {
        return errorResponse("มีแท็กชื่อนี้อยู่แล้ว", 400);
      }

      const newTagId = `tag_${randomUUID()}`;
      const [createdTag] = await db
        .insert(tag)
        .values({
          id: newTagId,
          name: validName,
          color: validColor,
          userId: user.id,
        })
        .returning();

      return createdResponse(
        createdTag ? toTag(createdTag) : null,
        "สร้างแท็กเรียบร้อย",
      );
    }

    if (action === "delete_tag") {
      await db.delete(tag).where(eq(tag.userId, user.id));
      return successResponse(null, "ลบแท็กเรียบร้อย");
    }

    if (action === "save_rule") {
      if (!rule_type || rule_value === undefined) {
        return errorResponse("กรุณากรอกข้อมูลกฎและเงื่อนไข", 400);
      }

      const [existingRule] = await db
        .select()
        .from(tagRule)
        .where(and(eq(tagRule.userId, user.id), eq(tagRule.type, rule_type)))
        .limit(1);

      if (existingRule) {
        await db
          .update(tagRule)
          .set({ ruleValue: rule_value })
          .where(eq(tagRule.id, existingRule.id));
      } else {
        await db
          .insert(tagRule)
          .values({
            id: `tr_${randomUUID()}`,
            type: rule_type,
            ruleValue: rule_value,
            userId: user.id,
          });
      }

      const userRules = await getUserItems(db, tagRule, user.id, toTagRule);
      return successResponse(userRules, "ปรับปรุงกฎข้อจำกัดแท็กสำเร็จ");
    }

    if (action === "delete_rule") {
      await db
        .delete(tagRule)
        .where(and(eq(tagRule.id, rule_id), eq(tagRule.userId, user.id)));
      const userRules = await getUserItems(db, tagRule, user.id, toTagRule);
      return successResponse(userRules, "ยกเลิกกฎข้อจำกัดแท็กเรียบร้อย");
    }

    return errorResponse("Action not supported", 400);
  } catch (e: any) {
    return errorResponse(e.message);
  }
}
