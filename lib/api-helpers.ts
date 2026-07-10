import { NextResponse } from "next/server";
import { Database } from "drizzle-orm";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { error?: string; data?: T } {
  try {
    const validated = schema.parse(data);
    return { data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => e.message).join(", ");
      return { error: messages };
    }
    return { error: "Invalid input" };
  }
}

export function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function successResponse(data: unknown, message?: string) {
  return NextResponse.json(
    message ? { message, data } : { data },
  );
}

export function createdResponse(data: unknown, message: string = "Created successfully") {
  return NextResponse.json({ message, data }, { status: 201 });
}

export async function getUserItems<T>(
  db: any,
  table: any,
  userId: string,
  converter: (row: any) => T,
): Promise<T[]> {
  const rows = await db
    .select()
    .from(table)
    .where(eq(table.userId, userId));
  return rows.map(converter);
}

export async function deleteUserItem(
  db: any,
  table: any,
  id: string,
  userId: string,
  message: string = "Deleted successfully",
) {
  await db
    .delete(table)
    .where(and(eq(table.id, id), eq(table.userId, userId)));
  return successResponse(null, message);
}

export async function toggleUserItemActive<T>(
  db: any,
  table: any,
  id: string,
  userId: string,
  converter: (row: any) => T,
  message: string = "Status updated",
  fieldName: string = "isActive",
) {
  const [existing] = await db
    .select()
    .from(table)
    .where(and(eq(table.id, id), eq(table.userId, userId)))
    .limit(1);

  if (!existing) {
    return errorResponse("Item not found", 404);
  }

  const currentValue = existing[fieldName];
  const updateData: Record<string, unknown> = {};
  updateData[fieldName] = !currentValue;

  const [updated] = await db
    .update(table)
    .set(updateData)
    .where(eq(table.id, id))
    .returning();

  return successResponse(
    updated ? converter(updated) : null,
    message,
  );
}

export async function withAuth(user: any, handler: () => Promise<Response>) {
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }
  return handler();
}

export async function getOrAuthenticateUser(
  req: NextRequest,
  getSessionUser: () => Promise<any>,
  authenticateApiKey: (header: string | null) => any,
) {
  let user = await getSessionUser();
  if (!user) {
    const authHeader = req.headers.get("Authorization");
    user = await authenticateApiKey(authHeader);
  }
  return user;
}

export async function createGoogleDriveFolder(
  name: string,
  accessToken: string,
): Promise<{ folderId?: string; folderLink?: string }> {
  try {
    const res = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `${name}_workspace_folder`,
        mimeType: "application/vnd.google-apps.folder",
      }),
    });

    if (!res.ok) {
      console.error("Failed to create Drive folder:", await res.text());
      return {};
    }

    const data = await res.json();
    return {
      folderId: data.id,
      folderLink: `https://drive.google.com/drive/folders/${data.id}`,
    };
  } catch (err) {
    console.error("Error creating Google Drive folder:", err);
    return {};
  }
}

export function sortTasks(
  tasks: any[],
  sortBy: string = "-created_at",
): any[] {
  const sorted = [...tasks];

  if (sortBy.includes("due_date")) {
    sorted.sort((a, b) => {
      const dateA = a.due_date || "9999-12-31";
      const dateB = b.due_date || "9999-12-31";
      return sortBy.startsWith("-")
        ? dateB.localeCompare(dateA)
        : dateA.localeCompare(dateB);
    });
  } else if (sortBy.includes("priority")) {
    const pMap = { high: 3, medium: 2, low: 1 } as const;
    sorted.sort((a, b) =>
      sortBy.startsWith("-")
        ? pMap[a.priority] - pMap[b.priority]
        : pMap[b.priority] - pMap[a.priority],
    );
  }

  return sorted;
}

export function paginateTasks(
  tasks: any[],
  page: number = 1,
  limit: number = 100,
): { data: any[]; meta: Record<string, number> } {
  const total = tasks.length;
  const offset = (page - 1) * limit;
  const paginated = tasks.slice(offset, offset + limit);

  return {
    data: paginated,
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}
