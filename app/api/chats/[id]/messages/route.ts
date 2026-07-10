import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-helpers";
import { getDb } from "@/lib/db/client";
import { chat, chatEvent } from "@/lib/db/schema";
import { getChatEvents, saveChatEvent } from "@/lib/eve-chat";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { id: chatId } = await params;
    const db = getDb();

    // Verify chat ownership
    const [chatRecord] = await db
      .select()
      .from(chat)
      .where(eq(chat.id, chatId))
      .limit(1);

    if (!chatRecord || chatRecord.userId !== user.id) {
      return errorResponse("Chat not found or access denied", 404);
    }

    const events = await getChatEvents(chatId);
    return successResponse({ events });
  } catch (e: any) {
    return errorResponse(e.message || "Failed to fetch messages", 500);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { id: chatId } = await params;
    const { eventIndex, event } = await req.json();

    if (eventIndex === undefined || !event) {
      return errorResponse("Event index and event data are required", 400);
    }

    const db = getDb();

    // Verify chat ownership
    const [chatRecord] = await db
      .select()
      .from(chat)
      .where(eq(chat.id, chatId))
      .limit(1);

    if (!chatRecord || chatRecord.userId !== user.id) {
      return errorResponse("Chat not found or access denied", 404);
    }

    await saveChatEvent(chatId, eventIndex, event);
    return successResponse(null, "Message saved successfully");
  } catch (e: any) {
    return errorResponse(e.message || "Failed to save message", 500);
  }
}
