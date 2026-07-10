import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { getSessionUser } from "@/lib/auth";
import { webhook } from "@/lib/db/schema";
import { toWebhook } from "@/lib/db/orm";
import {
  errorResponse,
  successResponse,
  createdResponse,
  getUserItems,
  deleteUserItem,
  toggleUserItemActive,
} from "@/lib/api-helpers";

/**
 * JSDoc: ตรวจสอบและบันทึก Webhooks (GET/POST /api/webhooks)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const db = getDb();
    const userWebhooks = await getUserItems(db, webhook, user.id, toWebhook);
    return successResponse(userWebhooks);
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

    const { action, id, url, events } = await req.json();
    const db = getDb();

    if (action === "delete") {
      return await deleteUserItem(db, webhook, id, user.id, "ลบ Webhook เรียบร้อย");
    }

    if (action === "toggle") {
      return await toggleUserItemActive(db, webhook, id, user.id, toWebhook, "เปลี่ยนสถานะ Webhook เรียบร้อย");
    }

    if (!url || !events || !events.length) {
      return errorResponse("กรุณากรอก URL และเลือก Event อย่างน้อย 1 รายการ", 400);
    }

    const webId = `web_${randomUUID()}`;
    const [created] = await db
      .insert(webhook)
      .values({
        id: webId,
        url,
        events,
        isActive: true,
        userId: user.id,
      })
      .returning();

    return createdResponse(
      created ? toWebhook(created) : null,
      "สร้าง Webhook สำเร็จ",
    );
  } catch (e: any) {
    return errorResponse(e.message);
  }
}
