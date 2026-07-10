import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { getSessionUser } from "@/lib/auth";
import { folder } from "@/lib/db/schema";
import { toFolder } from "@/lib/db/orm";
import { errorResponse, successResponse, createdResponse } from "@/lib/api-helpers";

/**
 * JSDoc: บริหารจัดการโฟลเดอร์สำหรับโครงสร้าง Node (GET/POST /api/folders)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(folder)
      .where(eq(folder.userId, user.id))
      .orderBy(desc(folder.createdAt));
    const userFolders = rows.map(toFolder);

    return successResponse(userFolders);
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

    const { name, parent_id } = await req.json();
    if (!name) {
      return errorResponse("กรุณากรอกชื่อโฟลเดอร์", 400);
    }

    const db = getDb();
    const folderId = `fold_${randomUUID()}`;

    const [createdFolder] = await db
      .insert(folder)
      .values({
        id: folderId,
        name,
        parentId: parent_id || null,
        userId: user.id,
      })
      .returning();

    return createdResponse(
      createdFolder ? toFolder(createdFolder) : null,
      "สร้างโฟลเดอร์สำเร็จ",
    );
  } catch (e: any) {
    return errorResponse(e.message);
  }
}
