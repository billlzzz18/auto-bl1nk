import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { getSessionUser } from "@/lib/auth";
import { extension } from "@/lib/db/schema";
import { toExtension } from "@/lib/db/orm";
import {
  errorResponse,
  successResponse,
  createdResponse,
  getUserItems,
  deleteUserItem,
  toggleUserItemActive,
} from "@/lib/api-helpers";

/**
 * JSDoc: ตรวจสอบและควบคุมระบบเสริมขยายความสามารถ (GET/POST /api/extensions)
 * ปรับแต่ง Theme, Block ในลบเอดิเตอร์, ShortCut, Worker/Automation ด้วย Developer Console
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const db = getDb();
    const userExtensions = await getUserItems(db, extension, user.id, toExtension);
    return successResponse(userExtensions);
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

    const body = await req.json();
    const { action, id, name, version, author, type, code } = body;

    const db = getDb();

    if (action === "delete") {
      return await deleteUserItem(db, extension, id, user.id, "ถอนการติดตั้ง Extension เรียบร้อย");
    }

    if (action === "toggle") {
      return await toggleUserItemActive(db, extension, id, user.id, toExtension, "ปรับปรุงสถานะการใช้งาน Extension สำเร็จ", "isEnabled");
    }

    if (!name || !type || !code) {
      return errorResponse("กรุณากรอกข้อมูลและซอร์สโค้ดของ Extension ให้ครบถ้วน", 400);
    }

    const extId = `ext_${randomUUID()}`;
    const [created] = await db
      .insert(extension)
      .values({
        id: extId,
        name,
        version: version || "1.0.0",
        author: author || "Developer Node",
        type,
        code,
        isEnabled: true,
        userId: user.id,
      })
      .returning();

    return createdResponse(
      created ? toExtension(created) : null,
      "ติดตั้งและพร้อมรัน Extension สำเร็จ!",
    );
  } catch (e: any) {
    return errorResponse(e.message);
  }
}
