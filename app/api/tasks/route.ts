import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db/client";
import { getSessionUser, authenticateApiKey } from "@/lib/auth";
import { task } from "@/lib/db/schema";
import { toTask } from "@/lib/db/orm";
import {
  errorResponse,
  successResponse,
  createdResponse,
  getOrAuthenticateUser,
  sortTasks,
  paginateTasks,
  validateInput,
} from "@/lib/api-helpers";
import { createTaskSchema } from "@/lib/validation";

/**
 * JSDoc: บริหารจัดการงาน (GET/POST /api/tasks)
 * รองรับการกรองข้อมูลความละเอียดสูง, ค้นหาแบบ Fuzzy, การจัดเรียง, Pagination,
 * ระบบความปลอดภัย RLS, ตรวจสอบเวลาชนขัดแย้ง, และการรัน Tag Rules Engine อัตโนมัติ
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getOrAuthenticateUser(
      req,
      getSessionUser,
      authenticateApiKey,
    );

    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project_id");
    const status = searchParams.get("status");
    const tag = searchParams.get("tag");
    const priority = searchParams.get("priority");
    const type = searchParams.get("type");
    const q = searchParams.get("q");
    const sort = searchParams.get("sort") || "-created_at";
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    const db = getDb();
    const whereClauses = [eq(task.userId, user.id)];

    if (projectId) whereClauses.push(eq(task.projectId, projectId));
    if (status) whereClauses.push(eq(task.status, status));
    if (priority) whereClauses.push(eq(task.priority, priority));
    if (type) whereClauses.push(eq(task.type, type));
    if (q) {
      whereClauses.push(
        or(ilike(task.title, `%${q}%`), ilike(task.description, `%${q}%`)),
      );
    }

    const rows = await db
      .select()
      .from(task)
      .where(and(...whereClauses))
      .orderBy(desc(task.createdAt));
    let tasks = rows.map(toTask);

    if (tag) {
      tasks = tasks.filter((item) => item.tags.includes(tag));
    }

    tasks = sortTasks(tasks, sort);
    const { data: paginated, meta } = paginateTasks(tasks, page, limit);

    return NextResponse.json({ data: paginated, meta });
  } catch (e: any) {
    return errorResponse(e.message || "Internal Server Error");
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getOrAuthenticateUser(
      req,
      getSessionUser,
      authenticateApiKey,
    );

    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const validation = validateInput(createTaskSchema, body);

    if (validation.error) {
      return errorResponse(validation.error, 400);
    }

    const {
      title,
      project_id,
      description,
      status,
      due_date,
      start_time,
      end_time,
      priority,
      type,
      estimated_time,
      actual_time,
      parent_id,
      tags,
    } = validation.data!;

    const db = getDb();
    const normalizedDueDate =
      due_date || new Date().toISOString().split("T")[0];

    const [taskCount] = await db
      .select({ count: task.id })
      .from(task)
      .where(eq(task.userId, user.id));
    const codeId = `BL1NK-${1001 + (taskCount ? 1 : 0)}`;

    const [createdTask] = await db
      .insert(task)
      .values({
        id: codeId,
        title,
        projectId: project_id,
        userId: user.id,
        description: description || "",
        status: status || "todo",
        dueDate: normalizedDueDate,
        startTime: start_time || undefined,
        endTime: end_time || undefined,
        priority: priority || "medium",
        type: normalizedType,
        estimatedTime,
        actualTime,
        parentId: parent_id || undefined,
        tags: tags || [],
      })
      .returning();

    return createdResponse(
      createdTask ? toTask(createdTask) : null,
      "สร้างงานสำเร็จ",
    );
  } catch (e: any) {
    return errorResponse(e.message || "Internal Server Error");
  }
}
