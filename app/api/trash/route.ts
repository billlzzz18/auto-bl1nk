import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { getSessionUser } from "@/lib/auth";
import { project, task, trashItem } from "@/lib/db/schema";
import { toProject, toTask, toTrashItem } from "@/lib/db/orm";

/**
 * JSDoc: ตรวจสอบ คืนสถานะ และลบข้อมูลออกจากถังขยะแบบถาวร (GET/POST /api/trash)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(trashItem)
      .where(eq(trashItem.userId, user.id));
    const userTrash = rows.map(toTrashItem);

    return NextResponse.json({ data: userTrash });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, id } = body;

    const db = getDb();

    // 1. ล้างถังขยะทั้งหมด (Empty Trash)
    if (action === "empty_trash") {
      await db.delete(trashItem).where(eq(trashItem.userId, user.id));
      return NextResponse.json({ message: "ล้างถังขยะเรียบร้อยแล้ว" });
    }

    const [existingTrash] = await db
      .select()
      .from(trashItem)
      .where(eq(trashItem.id, id))
      .limit(1);
    if (!existingTrash) {
      return NextResponse.json(
        { error: "ไม่พบรายการนี้ในถังขยะ" },
        { status: 404 },
      );
    }

    const currentTrash = toTrashItem(existingTrash);

    // 2. ดึงคืนรายการหลัก (Restore Item)
    if (action === "restore") {
      const { item_type, item_data } = currentTrash;

      if (item_type === "project") {
        const payload = item_data as {
          project?: Record<string, unknown>;
          tasks?: Array<Record<string, unknown>>;
        };
        if (payload.project) {
          await db.insert(project).values({
            id: String(payload.project.id),
            name: String(payload.project.name ?? ""),
            description: String(payload.project.description ?? ""),
            userId: String(payload.project.user_id ?? ""),
            isFavorite: Boolean(payload.project.is_favorite),
            sharingSettings: payload.project.sharing_settings as Record<
              string,
              unknown
            >,
            customProperties: Array.isArray(payload.project.custom_properties)
              ? (payload.project.custom_properties as Array<
                  Record<string, unknown>
                >)
              : [],
            driveFolderId: payload.project.drive_folder_id as
              | string
              | undefined,
            driveFolderLink: payload.project.drive_folder_link as
              | string
              | undefined,
            folderId: payload.project.folder_id as string | null | undefined,
          });
        }
        if (payload.tasks?.length) {
          await Promise.all(
            payload.tasks.map((taskRow) =>
              db.insert(task).values({
                id: String(taskRow.id),
                title: String(taskRow.title ?? ""),
                projectId: String(taskRow.project_id ?? ""),
                userId: String(taskRow.user_id ?? ""),
                description: String(taskRow.description ?? ""),
                status: String(taskRow.status ?? "todo"),
                dueDate: String(taskRow.due_date ?? ""),
                startTime: taskRow.start_time as string | undefined,
                endTime: taskRow.end_time as string | undefined,
                priority: String(taskRow.priority ?? "medium"),
                type: String(taskRow.type ?? "task"),
                estimatedTime:
                  taskRow.estimated_time != null
                    ? Number(taskRow.estimated_time)
                    : undefined,
                actualTime:
                  taskRow.actual_time != null
                    ? Number(taskRow.actual_time)
                    : undefined,
                parentId: taskRow.parent_id as string | undefined,
                tags: Array.isArray(taskRow.tags)
                  ? (taskRow.tags as string[])
                  : [],
                comments: Array.isArray(taskRow.comments)
                  ? (taskRow.comments as Array<Record<string, unknown>>)
                  : [],
              }),
            ),
          );
        }
      } else if (item_type === "task" || item_type === "note") {
        const row = item_data as Record<string, unknown>;
        await db.insert(task).values({
          id: String(row.id),
          title: String(row.title ?? ""),
          projectId: String(row.project_id ?? ""),
          userId: String(row.user_id ?? ""),
          description: String(row.description ?? ""),
          status: String(row.status ?? "todo"),
          dueDate: String(row.due_date ?? ""),
          startTime: row.start_time as string | undefined,
          endTime: row.end_time as string | undefined,
          priority: String(row.priority ?? "medium"),
          type: String(row.type ?? "task"),
          estimatedTime:
            row.estimated_time != null ? Number(row.estimated_time) : undefined,
          actualTime:
            row.actual_time != null ? Number(row.actual_time) : undefined,
          parentId: row.parent_id as string | undefined,
          tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
          comments: Array.isArray(row.comments)
            ? (row.comments as Array<Record<string, unknown>>)
            : [],
        });
      }

      await db.delete(trashItem).where(eq(trashItem.id, id));

      return NextResponse.json({
        message: "กู้คืนข้อมูลกลับไปยังหน้าเดสก์บอร์ดปกติสำเร็จ",
      });
    }

    // 3. ลบแบบถาวร (Delete Permanently)
    if (action === "delete_permanently") {
      await db.delete(trashItem).where(eq(trashItem.id, id));
      return NextResponse.json({ message: "ลบข้อมูลแบบถาวรเรียบร้อยแล้ว" });
    }

    return NextResponse.json(
      { error: "Action not supported" },
      { status: 400 },
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
