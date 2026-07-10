import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { getSessionUser } from "@/lib/auth";
import { task } from "@/lib/db/schema";
import { errorResponse, successResponse } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("task_id");

    if (!taskId) {
      return errorResponse("Missing task_id", 400);
    }

    const db = getDb();
    const [existingTask] = await db
      .select()
      .from(task)
      .where(eq(task.id, taskId))
      .limit(1);
    if (!existingTask) {
      return errorResponse("Task not found", 404);
    }

    if (existingTask.userId !== user.id) {
      return errorResponse("Access Denied", 403);
    }

    const comments = Array.isArray(existingTask.comments)
      ? existingTask.comments
      : [];
    return NextResponse.json({ data: comments });
  } catch (e: any) {
    return errorResponse(e.message || "Internal Error");
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const { task_id, text, author_name } = body;

    if (!task_id || !text) {
      return errorResponse("Missing task_id or text", 400);
    }

    const db = getDb();
    const [existingTask] = await db
      .select()
      .from(task)
      .where(eq(task.id, task_id))
      .limit(1);
    if (!existingTask) {
      return errorResponse("Task not found", 404);
    }

    if (existingTask.userId !== user.id) {
      return errorResponse("Access Denied", 403);
    }

    const comments = Array.isArray(existingTask.comments)
      ? existingTask.comments
      : [];
    const newComment = {
      id: `cmt_${randomUUID()}`,
      task_id,
      author_name: author_name || user.name || "Anonymous",
      text,
      created_at: new Date().toISOString(),
    };

    await db
      .update(task)
      .set({ comments: [...comments, newComment] })
      .where(eq(task.id, task_id));

    return successResponse(newComment, "Comment added successfully");
  } catch (e: any) {
    return errorResponse(e.message || "Internal Error");
  }
}
