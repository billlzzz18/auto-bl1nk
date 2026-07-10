import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { getSessionUser, authenticateApiKey } from "@/lib/auth";
import { project, task, trashItem } from "@/lib/db/schema";
import { toProject, toTask } from "@/lib/db/orm";
import {
  errorResponse,
  successResponse,
  getOrAuthenticateUser,
} from "@/lib/api-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const currentUser = await getOrAuthenticateUser(
      req,
      getSessionUser,
      authenticateApiKey,
    );

    const db = getDb();
    const [row] = await db
      .select()
      .from(project)
      .where(eq(project.id, id))
      .limit(1);

    if (!row) {
      return errorResponse("ไม่พบโปรเจกต์", 404);
    }

    const projectData = toProject(row);
    const isOwner = Boolean(
      currentUser && projectData.user_id === currentUser.id,
    );
    const isPublic = Boolean(
      (row.sharingSettings as Record<string, unknown> | undefined)
        ?.public_access,
    );

    if (!isOwner && !isPublic) {
      return errorResponse("Access Denied: คุณไม่มีสิทธิ์เข้าถึงเนื้อหานี้", 403);
    }

    return successResponse(projectData);
  } catch (e: any) {
    return errorResponse(e.message || "Internal Error");
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const currentUser = await getOrAuthenticateUser(
      req,
      getSessionUser,
      authenticateApiKey,
    );

    if (!currentUser) {
      return errorResponse("Unauthorized", 401);
    }

    const db = getDb();
    const [existing] = await db
      .select()
      .from(project)
      .where(and(eq(project.id, id), eq(project.userId, currentUser.id)))
      .limit(1);

    if (!existing) {
      return errorResponse("ไม่พบโปรเจกต์", 404);
    }

    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.is_favorite !== undefined)
      updateData.isFavorite = !!body.is_favorite;
    if (body.sharing_settings !== undefined)
      updateData.sharingSettings = {
        ...(existing.sharingSettings as Record<string, unknown>),
        ...body.sharing_settings,
      };
    if (body.custom_properties !== undefined)
      updateData.customProperties = body.custom_properties;

    const [updated] = await db
      .update(project)
      .set(updateData)
      .where(and(eq(project.id, id), eq(project.userId, currentUser.id)))
      .returning();

    return successResponse(
      updated ? toProject(updated) : null,
      "อัปเดตโปรเจกต์สำเร็จ",
    );
  } catch (e: any) {
    return errorResponse(e.message || "Internal Error");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const currentUser = await getSessionUser();

    if (!currentUser) {
      return errorResponse("Unauthorized", 401);
    }

    const db = getDb();
    const [existing] = await db
      .select()
      .from(project)
      .where(and(eq(project.id, id), eq(project.userId, currentUser.id)))
      .limit(1);

    if (!existing) {
      return errorResponse("ไม่พบโปรเจกต์", 404);
    }

    const projectTasks = await db
      .select()
      .from(task)
      .where(eq(task.projectId, id));
    await db.insert(trashItem).values({
      id: `trash_${randomUUID()}`,
      itemType: "project",
      itemId: existing.id,
      itemData: {
        project: toProject(existing),
        tasks: projectTasks.map(toTask),
      },
      userId: currentUser.id,
    });
    await db.delete(project).where(eq(project.id, id));
    await db.delete(task).where(eq(task.projectId, id));

    return successResponse(
      null,
      "ย้ายโปรเจกต์และงานที่เกี่ยวข้องลงถังขยะเรียบร้อย",
    );
  } catch (e: any) {
    return errorResponse(e.message || "Internal Error");
  }
}
