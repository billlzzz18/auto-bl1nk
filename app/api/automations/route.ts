import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { getSessionUser } from "@/lib/auth";
import { automation } from "@/lib/db/schema";
import { toAutomation } from "@/lib/db/orm";
import {
  errorResponse,
  successResponse,
  createdResponse,
  getUserItems,
  deleteUserItem,
  toggleUserItemActive,
} from "@/lib/api-helpers";

/**
 * JSDoc: บริหารระบบจัดการ Automations (GET/POST /api/automations)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const db = getDb();
    const userAutomations = await getUserItems(db, automation, user.id, toAutomation);
    return successResponse(userAutomations);
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

    const {
      action,
      id,
      project_id,
      trigger_event,
      condition_field,
      condition_value,
      action_type,
      action_value,
      isActive,
    } = await req.json();

    const db = getDb();

    if (action === "delete") {
      return await deleteUserItem(db, automation, id, user.id, "ลบเวิร์กโฟลว์สำเร็จ");
    }

    if (action === "toggle") {
      return await toggleUserItemActive(db, automation, id, user.id, toAutomation, "แก้สเตตัสเรียบร้อย");
    }

    if (!project_id || !trigger_event || !action_type || !action_value) {
      return errorResponse("รบกวนกรอกรายละเอียดการตั้งค่า Workflow ให้ครบถ้วน", 400);
    }

    const autoId = `auto_${randomUUID()}`;
    const [created] = await db
      .insert(automation)
      .values({
        id: autoId,
        projectId: project_id,
        triggerEvent: trigger_event,
        conditionField: condition_field || undefined,
        conditionValue: condition_value || undefined,
        actionType: action_type,
        actionValue: action_value,
        isActive: isActive !== undefined ? !!isActive : true,
        userId: user.id,
      })
      .returning();

    return createdResponse(
      created ? toAutomation(created) : null,
      "สร้าง Automation Workflow สำเร็จ",
    );
  } catch (e: any) {
    return errorResponse(e.message);
  }
}
