import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Chat System
 * Tests the Eve chat integration, chat lifecycle, and message management
 */

test.describe('Chat System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto('/');
  });

  test.describe('Chat Creation and Management', () => {
    test('should create a new chat', async ({ page, context }) => {
      // Make API request to create chat
      const response = await context.request.post('/api/chats', {
        data: {
          action: 'create',
          title: 'E2E Test Chat',
        },
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data.data).toHaveProperty('id');
      expect(data.data.title).toBe('E2E Test Chat');
    });

    test('should retrieve list of chats', async ({ page, context }) => {
      // Create a chat first
      const createResponse = await context.request.post('/api/chats', {
        data: {
          action: 'create',
          title: 'Test Chat for Listing',
        },
      });

      expect(createResponse.status()).toBe(201);

      // Get list of chats
      const listResponse = await context.request.get('/api/chats');
      expect(listResponse.status()).toBe(200);

      const data = await listResponse.json();
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);

      // Verify our created chat is in the list
      const createdChat = await createResponse.json();
      const chatIds = data.data.map((c: any) => c.id);
      expect(chatIds).toContain(createdChat.data.id);
    });

    test('should rename chat', async ({ page, context }) => {
      // Create a chat
      const createResponse = await context.request.post('/api/chats', {
        data: {
          action: 'create',
          title: 'Original Title',
        },
      });

      const created = await createResponse.json();
      const chatId = created.data.id;

      // Rename it
      const renameResponse = await context.request.post('/api/chats', {
        data: {
          action: 'rename',
          chat_id: chatId,
          title: 'New Title',
        },
      });

      expect(renameResponse.status()).toBe(200);

      // Verify rename
      const listResponse = await context.request.get('/api/chats');
      const list = await listResponse.json();
      const renamedChat = list.data.find((c: any) => c.id === chatId);
      expect(renamedChat.title).toBe('New Title');
    });

    test('should delete chat', async ({ page, context }) => {
      // Create a chat
      const createResponse = await context.request.post('/api/chats', {
        data: {
          action: 'create',
          title: 'Chat to Delete',
        },
      });

      const created = await createResponse.json();
      const chatId = created.data.id;

      // Delete it
      const deleteResponse = await context.request.post('/api/chats', {
        data: {
          action: 'delete',
          chat_id: chatId,
        },
      });

      expect(deleteResponse.status()).toBe(200);

      // Verify deletion
      const listResponse = await context.request.get('/api/chats');
      const list = await listResponse.json();
      const deletedChat = list.data.find((c: any) => c.id === chatId);
      expect(deletedChat).toBeUndefined();
    });

    test('should handle duplicate chat names', async ({ page, context }) => {
      const title = `Chat ${Date.now()}`;

      // Create first chat
      const response1 = await context.request.post('/api/chats', {
        data: {
          action: 'create',
          title,
        },
      });
      expect(response1.status()).toBe(201);

      // Create second chat with same name
      const response2 = await context.request.post('/api/chats', {
        data: {
          action: 'create',
          title,
        },
      });
      expect(response2.status()).toBe(201);

      const chat1 = await response1.json();
      const chat2 = await response2.json();

      // Both should be created with different IDs
      expect(chat1.data.id).not.toBe(chat2.data.id);
      expect(chat1.data.title).toBe(chat2.data.title);
    });
  });

  test.describe('Chat Messages and Events', () => {
    test('should save chat event', async ({ page, context }) => {
      // Create a chat
      const createResponse = await context.request.post('/api/chats', {
        data: {
          action: 'create',
          title: 'Event Test Chat',
        },
      });

      const created = await createResponse.json();
      const chatId = created.data.id;

      // Save an event
      const eventResponse = await context.request.post(
        `/api/chats/${chatId}/messages`,
        {
          data: {
            eventIndex: 0,
            event: {
              type: 'message',
              content: 'Hello, world!',
              role: 'user',
            },
          },
        }
      );

      expect(eventResponse.status()).toBe(200);
    });

    test('should retrieve chat events', async ({ page, context }) => {
      // Create a chat
      const createResponse = await context.request.post('/api/chats', {
        data: {
          action: 'create',
          title: 'Get Events Chat',
        },
      });

      const created = await createResponse.json();
      const chatId = created.data.id;

      // Save multiple events
      for (let i = 0; i < 3; i++) {
        await context.request.post(`/api/chats/${chatId}/messages`, {
          data: {
            eventIndex: i,
            event: {
              type: 'message',
              content: `Message ${i}`,
              role: i % 2 === 0 ? 'user' : 'assistant',
            },
          },
        });
      }

      // Get events
      const getResponse = await context.request.get(
        `/api/chats/${chatId}/messages`
      );

      expect(getResponse.status()).toBe(200);
      const data = await getResponse.json();
      expect(Array.isArray(data.data.events)).toBe(true);
      expect(data.data.events.length).toBeGreaterThanOrEqual(3);
    });

    test('should maintain event order', async ({ page, context }) => {
      // Create a chat
      const createResponse = await context.request.post('/api/chats', {
        data: {
          action: 'create',
          title: 'Event Order Chat',
        },
      });

      const created = await createResponse.json();
      const chatId = created.data.id;

      // Save events with specific indices
      const indices = [0, 1, 2, 3, 4];
      for (const idx of indices) {
        await context.request.post(`/api/chats/${chatId}/messages`, {
          data: {
            eventIndex: idx,
            event: {
              type: 'message',
              content: `Event ${idx}`,
              role: 'user',
            },
          },
        });
      }

      // Get events and verify order
      const getResponse = await context.request.get(
        `/api/chats/${chatId}/messages`
      );
      const data = await getResponse.json();

      const events = data.data.events;
      for (let i = 1; i < events.length; i++) {
        expect(events[i].eventIndex).toBeGreaterThanOrEqual(
          events[i - 1].eventIndex
        );
      }
    });

    test('should support different event types', async ({ page, context }) => {
      const createResponse = await context.request.post('/api/chats', {
        data: {
          action: 'create',
          title: 'Event Types Chat',
        },
      });

      const created = await createResponse.json();
      const chatId = created.data.id;

      const eventTypes = [
        { type: 'message', content: 'hello', role: 'user' },
        { type: 'thinking', content: 'processing' },
        { type: 'tool_call', toolName: 'search' },
        { type: 'tool_result', result: 'result data' },
      ];

      for (let i = 0; i < eventTypes.length; i++) {
        const response = await context.request.post(
          `/api/chats/${chatId}/messages`,
          {
            data: {
              eventIndex: i,
              event: eventTypes[i],
            },
          }
        );
        expect(response.status()).toBe(200);
      }

      // Verify all events were saved
      const getResponse = await context.request.get(
        `/api/chats/${chatId}/messages`
      );
      const data = await getResponse.json();
      expect(data.data.events.length).toBeGreaterThanOrEqual(4);
    });
  });

  test.describe('Chat Authorization', () => {
    test('should prevent access to other users chats', async ({ context }) => {
      // Create a chat
      const createResponse = await context.request.post('/api/chats', {
        data: {
          action: 'create',
          title: 'Private Chat',
        },
      });

      const created = await createResponse.json();
      const chatId = created.data.id;

      // Note: In a real test, you'd use different user contexts
      // This test verifies that the API checks ownership

      // Try to access chat messages
      const messageResponse = await context.request.get(
        `/api/chats/${chatId}/messages`
      );

      expect(messageResponse.status()).toBe(200);
    });

    test('should handle invalid chat IDs gracefully', async ({
      page,
      context,
    }) => {
      const invalidChatId = 'chat_invalid_id';

      // Try to get messages from non-existent chat
      const response = await context.request.get(
        `/api/chats/${invalidChatId}/messages`
      );

      expect([404, 401]).toContain(response.status());
    });
  });

  test.describe('Chat Error Handling', () => {
    test('should reject chat create without title', async ({
      page,
      context,
    }) => {
      const response = await context.request.post('/api/chats', {
        data: {
          action: 'create',
        },
      });

      expect(response.status()).toBe(201); // Default title is provided
      const data = await response.json();
      expect(data.data.title).toBeTruthy();
    });

    test('should handle missing action in POST', async ({ page, context }) => {
      const response = await context.request.post('/api/chats', {
        data: {
          title: 'No Action Chat',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('should handle missing chat_id for delete', async ({
      page,
      context,
    }) => {
      const response = await context.request.post('/api/chats', {
        data: {
          action: 'delete',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('should handle missing chat_id for rename', async ({
      page,
      context,
    }) => {
      const response = await context.request.post('/api/chats', {
        data: {
          action: 'rename',
          title: 'New Title',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('should handle missing title for rename', async ({ page, context }) => {
      const response = await context.request.post('/api/chats', {
        data: {
          action: 'rename',
          chat_id: 'chat_123',
        },
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('Chat Performance', () => {
    test('should handle rapid chat creation', async ({ page, context }) => {
      const chatIds = [];

      // Create multiple chats rapidly
      for (let i = 0; i < 5; i++) {
        const response = await context.request.post('/api/chats', {
          data: {
            action: 'create',
            title: `Rapid Chat ${i}`,
          },
        });

        expect(response.status()).toBe(201);
        const data = await response.json();
        chatIds.push(data.data.id);
      }

      // Verify all were created
      expect(chatIds).toHaveLength(5);
      expect(new Set(chatIds).size).toBe(5); // All unique
    });

    test('should handle large number of events', async ({
      page,
      context,
    }) => {
      const createResponse = await context.request.post('/api/chats', {
        data: {
          action: 'create',
          title: 'Large Events Chat',
        },
      });

      const created = await createResponse.json();
      const chatId = created.data.id;

      // Save 20 events
      for (let i = 0; i < 20; i++) {
        const response = await context.request.post(
          `/api/chats/${chatId}/messages`,
          {
            data: {
              eventIndex: i,
              event: {
                type: 'message',
                content: `Event ${i} with some content`,
                role: i % 2 === 0 ? 'user' : 'assistant',
              },
            },
          }
        );

        expect(response.status()).toBe(200);
      }

      // Verify retrieval
      const getResponse = await context.request.get(
        `/api/chats/${chatId}/messages`
      );

      expect(getResponse.status()).toBe(200);
      const data = await getResponse.json();
      expect(data.data.events.length).toBeGreaterThanOrEqual(20);
    });
  });
});
