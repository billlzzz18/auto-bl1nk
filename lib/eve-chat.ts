import type { HandleMessageStreamEvent, SessionState } from 'eve/client';
import { getDb } from '@/lib/db/client';
import { chat, chatEvent } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

export interface ChatMessage {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  eventIndex?: number;
}

export async function createChat(userId: string, title: string = 'New Chat'): Promise<string> {
  const db = getDb();
  const chatId = `chat_${randomUUID()}`;

  await db.insert(chat).values({
    id: chatId,
    userId,
    title,
    eveSession: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return chatId;
}

export async function getUserChats(userId: string): Promise<any[]> {
  const db = getDb();
  const chats = await db
    .select()
    .from(chat)
    .where(eq(chat.userId, userId))
    .orderBy(desc(chat.updatedAt));

  return chats;
}

export async function getChat(chatId: string, userId: string): Promise<any | null> {
  const db = getDb();
  const [chatRecord] = await db
    .select()
    .from(chat)
    .where(eq(chat.id, chatId))
    .limit(1);

  if (!chatRecord || chatRecord.userId !== userId) {
    return null;
  }

  return chatRecord;
}

export async function saveChatEvent(
  chatId: string,
  eventIndex: number,
  event: HandleMessageStreamEvent
): Promise<void> {
  const db = getDb();

  await db.insert(chatEvent).values({
    id: `evt_${randomUUID()}`,
    chatId,
    eventIndex,
    event,
    createdAt: new Date().toISOString(),
  });

  // Update chat's updatedAt timestamp
  await db
    .update(chat)
    .set({ updatedAt: new Date().toISOString() })
    .where(eq(chat.id, chatId));
}

export async function getChatEvents(chatId: string): Promise<HandleMessageStreamEvent[]> {
  const db = getDb();
  const events = await db
    .select()
    .from(chatEvent)
    .where(eq(chatEvent.chatId, chatId))
    .orderBy(chatEvent.eventIndex);

  return events.map((e) => e.event as HandleMessageStreamEvent);
}

export async function updateChatSession(
  chatId: string,
  sessionState: SessionState
): Promise<void> {
  const db = getDb();

  await db
    .update(chat)
    .set({
      eveSession: sessionState,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(chat.id, chatId));
}

export async function savePendingMessage(
  chatId: string,
  message: string
): Promise<void> {
  const db = getDb();

  await db
    .update(chat)
    .set({
      pendingUserMessage: message,
      pendingUserMessageCreatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(chat.id, chatId));
}

export async function clearPendingMessage(chatId: string): Promise<void> {
  const db = getDb();

  await db
    .update(chat)
    .set({
      pendingUserMessage: null,
      pendingUserMessageCreatedAt: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(chat.id, chatId));
}

export async function deleteChat(chatId: string, userId: string): Promise<boolean> {
  const db = getDb();

  // Verify ownership
  const [chatRecord] = await db
    .select()
    .from(chat)
    .where(eq(chat.id, chatId))
    .limit(1);

  if (!chatRecord || chatRecord.userId !== userId) {
    return false;
  }

  // Delete chat events first
  await db.delete(chatEvent).where(eq(chatEvent.chatId, chatId));

  // Delete chat
  await db.delete(chat).where(eq(chat.id, chatId));

  return true;
}

export async function renameChat(chatId: string, userId: string, newTitle: string): Promise<boolean> {
  const db = getDb();

  // Verify ownership
  const [chatRecord] = await db
    .select()
    .from(chat)
    .where(eq(chat.id, chatId))
    .limit(1);

  if (!chatRecord || chatRecord.userId !== userId) {
    return false;
  }

  await db
    .update(chat)
    .set({
      title: newTitle,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(chat.id, chatId));

  return true;
}
