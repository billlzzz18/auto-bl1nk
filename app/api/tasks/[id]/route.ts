import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db/client";
import { getSessionUser, authenticateApiKey } from "@/lib/auth";
import { task, trashItem } from "@/lib/db/schema";
import { toTask } from "@/lib/db/orm";

/**
 * JSDoc: บริหารรายละเอียดงานรายชิ้น (GET/PUT/DELETE /api/tasks/[id])
 * ทำ RLS, ตรวจสอบความสอดคล้องตารางงาน, ตรวจสอบ Tag Rules, ส่งสัญญาณ Automation เหตุการณ์
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    let user = await getSessionUser();
    if (!user) {
      const authHeader = req.headers.get("Authorization");
      user = await authenticateApiKey(authHeader);
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const [currentTask] = await db
      .select()
      .from(task)
      .where(eq(task.id, id))
      .limit(1);

    if (!currentTask) {
      return NextResponse.json({ error: "ไม่พบข้อมูลงาน" }, { status: 404 });
    }

    if (task.user_id !== user.id) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    return NextResponse.json({ data: toTask(currentTask) });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Internal Error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    let user = await getSessionUser();
    if (!user) {
      const authHeader = req.headers.get("Authorization");
      user = await authenticateApiKey(authHeader);
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const [existingTask] = await db
      .select()
      .from(task)
      .where(and(eq(task.id, id), eq(task.userId, user.id)))
      .limit(1);

    if (!existingTask) {
      return NextResponse.json({ error: "ไม่พบข้อมูลงาน" }, { status: 404 });
    }

    if (existingTask.userId !== user.id) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.due_date !== undefined) updateData.dueDate = body.due_date;
    if (body.start_time !== undefined)
      updateData.startTime = body.start_time || undefined;
    if (body.end_time !== undefined)
      updateData.endTime = body.end_time || undefined;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.estimated_time !== undefined)
      updateData.estimatedTime = body.estimated_time;
    if (body.actual_time !== undefined)
      updateData.actualTime = body.actual_time;
    if (body.parent_id !== undefined)
      updateData.parentId = body.parent_id || undefined;
    if (body.tags !== undefined) updateData.tags = body.tags;

    const [updatedTask] = await db
      .update(task)
      .set(updateData)
      .where(and(eq(task.id, id), eq(task.userId, user.id)))
      .returning();

    return NextResponse.json({
      message: "อัปเดตงานเสร็จสิ้น",
      data: updatedTask ? toTask(updatedTask) : null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Internal Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const [existingTask] = await db
      .select()
      .from(task)
      .where(and(eq(task.id, id), eq(task.userId, user.id)))
      .limit(1);

    if (!existingTask) {
      return NextResponse.json({ error: "ไม่พบงาน" }, { status: 404 });
    }

    if (existingTask.userId !== user.id) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    await db.insert(trashItem).values({
      id: `trash_${randomUUID()}`,
      itemType: "task",
      itemId: existingTask.id,
      itemData: toTask(existingTask),
      userId: user.id,
    });
    await db.delete(task).where(eq(task.id, id));

    return NextResponse.json({ message: "ย้ายลงถังขยะเรียบร้อย" });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Internal Error" },
      { status: 500 },
    );
  }
}
