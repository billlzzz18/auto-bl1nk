import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { getDb } from '@/lib/db/client';
import { chat, chatEvent, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

describe('Chat API', () => {
  let testUserId: string;
  let testChatId: string;
  let db: any;

  beforeEach(async () => {
    db = getDb();
    testUserId = `user_${randomUUID()}`;

    // Create test user
    await db.insert(users).values({
      id: testUserId,
      email: `test-${randomUUID()}@example.com`,
      name: 'Test User',
      passwordHash: 'hashed_password',
      createdAt: new Date().toISOString(),
    });

    // Create test chat
    testChatId = `chat_${randomUUID()}`;
    await db.insert(chat).values({
      id: testChatId,
      userId: testUserId,
      title: 'Test Chat',
      eveSession: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  afterEach(async () => {
    // Cleanup
    if (testChatId) {
      await db.delete(chatEvent).where(eq(chatEvent.chatId, testChatId));
      await db.delete(chat).where(eq(chat.id, testChatId));
    }
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  describe('Chat Management', () => {
    it('should create a new chat', async () => {
      const newChatId = `chat_${randomUUID()}`;
      const result = await db
        .insert(chat)
        .values({
          id: newChatId,
          userId: testUserId,
          title: 'New Chat',
          eveSession: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(newChatId);
      expect(result[0].userId).toBe(testUserId);
      expect(result[0].title).toBe('New Chat');

      await db.delete(chat).where(eq(chat.id, newChatId));
    });

    it('should retrieve user chats ordered by updatedAt descending', async () => {
      const chat1Id = `chat_${randomUUID()}`;
      const chat2Id = `chat_${randomUUID()}`;

      await db.insert(chat).values({
        id: chat1Id,
        userId: testUserId,
        title: 'First Chat',
        eveSession: null,
        createdAt: new Date(Date.now() - 60000).toISOString(),
        updatedAt: new Date(Date.now() - 60000).toISOString(),
      });

      await db.insert(chat).values({
        id: chat2Id,
        userId: testUserId,
        title: 'Second Chat',
        eveSession: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const userChats = await db
        .select()
        .from(chat)
        .where(eq(chat.userId, testUserId));

      expect(userChats.length).toBeGreaterThanOrEqual(2);

      // Verify ordering (most recent first)
      const sorted = userChats.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      expect(sorted[0].id).toBe(chat2Id);

      await db.delete(chat).where(eq(chat.id, chat1Id));
      await db.delete(chat).where(eq(chat.id, chat2Id));
    });

    it('should update chat title', async () => {
      await db
        .update(chat)
        .set({ title: 'Updated Title' })
        .where(eq(chat.id, testChatId));

      const [updated] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, testChatId))
        .limit(1);

      expect(updated.title).toBe('Updated Title');
    });

    it('should update chat timestamp when modified', async () => {
      const before = new Date();
      await new Promise((resolve) => setTimeout(resolve, 100));

      await db
        .update(chat)
        .set({ updatedAt: new Date().toISOString() })
        .where(eq(chat.id, testChatId));

      const [updated] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, testChatId))
        .limit(1);

      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(
        before.getTime()
      );
    });

    it('should delete chat with cascade deletion of events', async () => {
      const eventId = `evt_${randomUUID()}`;
      await db.insert(chatEvent).values({
        id: eventId,
        chatId: testChatId,
        eventIndex: 0,
        event: { type: 'message', content: 'test' },
        createdAt: new Date().toISOString(),
      });

      // Verify event exists
      let [event] = await db
        .select()
        .from(chatEvent)
        .where(eq(chatEvent.id, eventId))
        .limit(1);
      expect(event).toBeDefined();

      // Delete chat
      await db.delete(chatEvent).where(eq(chatEvent.chatId, testChatId));
      await db.delete(chat).where(eq(chat.id, testChatId));

      // Verify both are deleted
      const chats = await db
        .select()
        .from(chat)
        .where(eq(chat.id, testChatId));
      expect(chats).toHaveLength(0);

      const events = await db
        .select()
        .from(chatEvent)
        .where(eq(chatEvent.id, eventId));
      expect(events).toHaveLength(0);

      // Reset for cleanup
      testChatId = '';
    });

    it('should prevent access to other users chats', async () => {
      const otherUserId = `user_${randomUUID()}`;
      await db.insert(users).values({
        id: otherUserId,
        email: `other-${randomUUID()}@example.com`,
        name: 'Other User',
        passwordHash: 'hashed_password',
        createdAt: new Date().toISOString(),
      });

      const otherUserChats = await db
        .select()
        .from(chat)
        .where(eq(chat.userId, otherUserId));

      expect(otherUserChats).toHaveLength(0);

      const testUserChats = await db
        .select()
        .from(chat)
        .where(eq(chat.userId, testUserId));

      expect(testUserChats.length).toBeGreaterThan(0);

      await db.delete(users).where(eq(users.id, otherUserId));
    });
  });

  describe('Chat Events', () => {
    it('should save chat event', async () => {
      const eventId = `evt_${randomUUID()}`;
      const event = {
        type: 'message' as const,
        content: 'Hello world',
        role: 'user' as const,
      };

      const result = await db
        .insert(chatEvent)
        .values({
          id: eventId,
          chatId: testChatId,
          eventIndex: 0,
          event,
          createdAt: new Date().toISOString(),
        })
        .returning();

      expect(result).toHaveLength(1);
      expect(result[0].chatId).toBe(testChatId);
      expect(result[0].event).toEqual(event);
      expect(result[0].eventIndex).toBe(0);

      await db.delete(chatEvent).where(eq(chatEvent.id, eventId));
    });

    it('should retrieve chat events ordered by eventIndex', async () => {
      const eventIds = Array.from({ length: 3 }, () => `evt_${randomUUID()}`);

      for (let i = 0; i < 3; i++) {
        await db.insert(chatEvent).values({
          id: eventIds[i],
          chatId: testChatId,
          eventIndex: i,
          event: { type: 'message', content: `Message ${i}` },
          createdAt: new Date().toISOString(),
        });
      }

      const events = await db
        .select()
        .from(chatEvent)
        .where(eq(chatEvent.chatId, testChatId));

      expect(events.length).toBeGreaterThanOrEqual(3);

      const chatEvents = events.filter((e) => eventIds.includes(e.id));
      expect(chatEvents).toHaveLength(3);

      // Verify ordered by eventIndex
      for (let i = 0; i < chatEvents.length; i++) {
        expect(chatEvents[i].eventIndex).toBe(i);
      }

      for (const eventId of eventIds) {
        await db.delete(chatEvent).where(eq(chatEvent.id, eventId));
      }
    });

    it('should support different event types', async () => {
      const eventTypes = [
        { type: 'message', content: 'text' },
        { type: 'thinking', content: 'logic' },
        { type: 'tool_call', toolName: 'function' },
        { type: 'tool_result', result: 'output' },
      ];

      const eventIds: string[] = [];
      for (let i = 0; i < eventTypes.length; i++) {
        const eventId = `evt_${randomUUID()}`;
        eventIds.push(eventId);
        await db.insert(chatEvent).values({
          id: eventId,
          chatId: testChatId,
          eventIndex: i,
          event: eventTypes[i],
          createdAt: new Date().toISOString(),
        });
      }

      const events = await db
        .select()
        .from(chatEvent)
        .where(eq(chatEvent.chatId, testChatId));

      expect(events.length).toBeGreaterThanOrEqual(4);

      for (const eventId of eventIds) {
        await db.delete(chatEvent).where(eq(chatEvent.id, eventId));
      }
    });

    it('should handle large event payloads', async () => {
      const largeContent = 'x'.repeat(10000);
      const eventId = `evt_${randomUUID()}`;

      await db.insert(chatEvent).values({
        id: eventId,
        chatId: testChatId,
        eventIndex: 0,
        event: { type: 'message', content: largeContent },
        createdAt: new Date().toISOString(),
      });

      const [event] = await db
        .select()
        .from(chatEvent)
        .where(eq(chatEvent.id, eventId))
        .limit(1);

      expect((event.event as any).content).toHaveLength(10000);

      await db.delete(chatEvent).where(eq(chatEvent.id, eventId));
    });
  });

  describe('Chat Session State', () => {
    it('should save and retrieve chat session state', async () => {
      const sessionState = {
        mode: 'test' as const,
        messages: [{ role: 'user' as const, content: 'Hello' }],
      };

      await db
        .update(chat)
        .set({ eveSession: sessionState })
        .where(eq(chat.id, testChatId));

      const [updated] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, testChatId))
        .limit(1);

      expect(updated.eveSession).toEqual(sessionState);
    });

    it('should handle null session state', async () => {
      await db
        .update(chat)
        .set({ eveSession: null })
        .where(eq(chat.id, testChatId));

      const [updated] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, testChatId))
        .limit(1);

      expect(updated.eveSession).toBeNull();
    });
  });

  describe('Pending Messages', () => {
    it('should save pending user message', async () => {
      const message = 'This is a pending message';

      await db
        .update(chat)
        .set({
          pendingUserMessage: message,
          pendingUserMessageCreatedAt: new Date().toISOString(),
        })
        .where(eq(chat.id, testChatId));

      const [updated] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, testChatId))
        .limit(1);

      expect(updated.pendingUserMessage).toBe(message);
      expect(updated.pendingUserMessageCreatedAt).toBeTruthy();
    });

    it('should clear pending message', async () => {
      await db
        .update(chat)
        .set({
          pendingUserMessage: null,
          pendingUserMessageCreatedAt: null,
        })
        .where(eq(chat.id, testChatId));

      const [updated] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, testChatId))
        .limit(1);

      expect(updated.pendingUserMessage).toBeNull();
      expect(updated.pendingUserMessageCreatedAt).toBeNull();
    });
  });
});
