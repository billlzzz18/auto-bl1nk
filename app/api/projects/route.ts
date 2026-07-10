import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db/client";
import { getSessionUser, authenticateApiKey } from "@/lib/auth";
import { project } from "@/lib/db/schema";
import { toProject } from "@/lib/db/orm";
import {
  errorResponse,
  successResponse,
  createdResponse,
  getOrAuthenticateUser,
  createGoogleDriveFolder,
} from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getOrAuthenticateUser(
      req,
      getSessionUser,
      authenticateApiKey,
    );

    if (!currentUser) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const favOnly = searchParams.get("favorite") === "true";

    const db = getDb();
    const rows = await db
      .select()
      .from(project)
      .where(eq(project.userId, currentUser.id))
      .orderBy(desc(project.createdAt));
    let userProjects = rows.map(toProject);

    if (favOnly) {
      userProjects = userProjects.filter((item) => item.is_favorite);
    }

    return successResponse(userProjects);
  } catch (e: any) {
    return errorResponse(e.message || "Internal Server Error");
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getOrAuthenticateUser(
      req,
      getSessionUser,
      authenticateApiKey,
    );

    if (!currentUser) {
      return errorResponse("Unauthorized", 401);
    }

    const {
      name,
      description,
      is_favorite,
      custom_properties,
      google_access_token,
      folder_id,
    } = await req.json();

    if (!name) {
      return errorResponse("กรุณากรอกชื่อโปรเจกต์", 400);
    }

    const { folderId: driveFolderId, folderLink: driveFolderLink } =
      google_access_token
        ? await createGoogleDriveFolder(name, google_access_token)
        : {};

    const db = getDb();
    const projId = `proj_${randomUUID()}`;

    const [created] = await db
      .insert(project)
      .values({
        id: projId,
        name,
        description: description || "",
        userId: currentUser.id,
        isFavorite: !!is_favorite,
        sharingSettings: {
          public_access: false,
          include_subpages: false,
        },
        customProperties: custom_properties || [],
        driveFolderId,
        driveFolderLink,
        folderId: folder_id || null,
      })
      .returning();

    return createdResponse(
      created ? toProject(created) : null,
      "สร้างโปรเจกต์เรียบร้อย",
    );
  } catch (e: any) {
    return errorResponse(e.message || "Internal Server Error");
  }
}
