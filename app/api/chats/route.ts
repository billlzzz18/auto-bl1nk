import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { errorResponse, successResponse, createdResponse } from "@/lib/api-helpers";
import {
  createChat,
  getUserChats,
  deleteChat,
  renameChat,
} from "@/lib/eve-chat";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const chats = await getUserChats(user.id);
    return successResponse(chats);
  } catch (e: any) {
    return errorResponse(e.message || "Failed to fetch chats", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { action, title, chat_id } = await req.json();

    if (action === "create") {
      const chatId = await createChat(user.id, title || "New Chat");
      return createdResponse({ id: chatId, title: title || "New Chat" }, "Chat created successfully");
    }

    if (action === "delete") {
      if (!chat_id) {
        return errorResponse("Chat ID is required", 400);
      }
      const deleted = await deleteChat(chat_id, user.id);
      if (!deleted) {
        return errorResponse("Chat not found or access denied", 404);
      }
      return successResponse(null, "Chat deleted successfully");
    }

    if (action === "rename") {
      if (!chat_id || !title) {
        return errorResponse("Chat ID and title are required", 400);
      }
      const renamed = await renameChat(chat_id, user.id, title);
      if (!renamed) {
        return errorResponse("Chat not found or access denied", 404);
      }
      return successResponse(null, "Chat renamed successfully");
    }

    return errorResponse("Invalid action", 400);
  } catch (e: any) {
    return errorResponse(e.message || "Failed to process chat action", 500);
  }
}
