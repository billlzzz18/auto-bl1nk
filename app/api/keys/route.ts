import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { getSessionUser } from "@/lib/auth";
import { apiKey } from "@/lib/db/schema";
import { toApiKey } from "@/lib/db/orm";
import { errorResponse, successResponse, createdResponse, getUserItems, deleteUserItem } from "@/lib/api-helpers";

/**
 * JSDoc: บริหารจัดการสิทธิ์การเชื่อมต่อ API Keys สำหรับนักพัฒนา (GET/POST /api/keys)
 * ความพรีเมียม: สุ่มคีย์ความปลอดภัยสูง, ปกปิด (Masked Key) เพื่อแสดงครั้งเดียวตอนตอบกลับ
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const db = getDb();
    const userKeys = await getUserItems(db, apiKey, user.id, toApiKey);
    return successResponse(userKeys);
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
    const db = getDb();

    if (body.action === "delete") {
      return await deleteUserItem(db, apiKey, body.id, user.id, "ลบ API Key เรียบร้อย");
    }

    const name = body.name || "New Custom Integration Cli";
    const randomBytes = crypto.randomBytes(18).toString("hex");
    const rawKey = `bl1nk_sec_${randomBytes}`;
    const masked_key = `bl1nk_...${rawKey.slice(-5)}`;

    const keyId = `key_${randomUUID()}`;
    const [createdKey] = await db
      .insert(apiKey)
      .values({
        id: keyId,
        key: rawKey,
        maskedKey: masked_key,
        name,
        userId: user.id,
      })
      .returning();

    return createdResponse(
      {
        id: createdKey?.id,
        name,
        raw_key: rawKey,
        masked_key: masked_key,
        created_at: createdKey?.createdAt?.toISOString?.() ?? new Date().toISOString(),
      },
      "สร้าง API Key สำเร็จ! กรุณาคัดลอกและบันทึกคีย์นี้ทันที เพราะระบบจะแสดงคีย์นีเพียงครั้งเดียวเท่านั้น",
    );
  } catch (e: any) {
    return errorResponse(e.message);
  }
}
