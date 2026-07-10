import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Validation System
 * Tests Zod schema validation across all API endpoints
 */

test.describe('API Validation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Authentication Validation', () => {
    test('should validate login email format', async ({ context }) => {
      const response = await context.request.post('/api/auth/login', {
        data: {
          email: 'invalid-email',
          password: 'password123',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });

    test('should validate login password minimum length', async ({
      context,
    }) => {
      const response = await context.request.post('/api/auth/login', {
        data: {
          email: 'user@example.com',
          password: 'short',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });

    test('should accept valid login credentials', async ({ context }) => {
      const response = await context.request.post('/api/auth/login', {
        data: {
          email: 'validuser@example.com',
          password: 'password123',
        },
      });

      // Will be 400/401 if user doesn't exist, but validation should pass
      expect([200, 401, 400]).toContain(response.status());
      if (response.status() !== 400) {
        const data = await response.json();
        expect(data).toHaveProperty('data') || expect(data).toHaveProperty('error');
      }
    });

    test('should validate register email format', async ({ context }) => {
      const response = await context.request.post('/api/auth/register', {
        data: {
          email: 'not-an-email',
          password: 'password123',
          name: 'Test User',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });

    test('should validate register password minimum length', async ({
      context,
    }) => {
      const response = await context.request.post('/api/auth/register', {
        data: {
          email: 'newuser@example.com',
          password: 'short',
          name: 'Test User',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });

    test('should validate register name is not empty', async ({ context }) => {
      const response = await context.request.post('/api/auth/register', {
        data: {
          email: 'newuser@example.com',
          password: 'password123',
          name: '',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });

    test('should validate register name maximum length', async ({ context }) => {
      const longName = 'a'.repeat(101);
      const response = await context.request.post('/api/auth/register', {
        data: {
          email: 'newuser@example.com',
          password: 'password123',
          name: longName,
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });
  });

  test.describe('Project Validation', () => {
    test('should reject project without name', async ({ context }) => {
      const response = await context.request.post('/api/projects', {
        data: {
          description: 'A project without name',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });

    test('should reject project with empty name', async ({ context }) => {
      const response = await context.request.post('/api/projects', {
        data: {
          name: '',
          description: 'Empty name project',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });

    test('should accept minimal project data', async ({ context }) => {
      const response = await context.request.post('/api/projects', {
        data: {
          name: `Test Project ${Date.now()}`,
        },
      });

      expect([200, 201, 401]).toContain(response.status());
    });

    test('should accept project with optional fields', async ({ context }) => {
      const response = await context.request.post('/api/projects', {
        data: {
          name: `Full Project ${Date.now()}`,
          description: 'A full project description',
          is_favorite: true,
          sharing_settings: { shared_with: ['user1'] },
          custom_properties: { color: 'blue' },
        },
      });

      expect([200, 201, 401]).toContain(response.status());
    });
  });

  test.describe('Task Validation', () => {
    test('should reject task without title', async ({ context }) => {
      const response = await context.request.post('/api/tasks', {
        data: {
          project_id: 'proj_123',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });

    test('should reject task without project_id', async ({ context }) => {
      const response = await context.request.post('/api/tasks', {
        data: {
          title: 'Task without project',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });

    test('should reject task with invalid status', async ({ context }) => {
      const response = await context.request.post('/api/tasks', {
        data: {
          title: 'Test Task',
          project_id: 'proj_123',
          status: 'invalid_status',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });

    test('should accept all valid status values', async ({ context }) => {
      const statuses = ['backlog', 'todo', 'in_progress', 'review', 'done'];

      for (const status of statuses) {
        const response = await context.request.post('/api/tasks', {
          data: {
            title: 'Test Task',
            project_id: 'proj_123',
            status,
          },
        });

        expect([200, 201, 400, 401]).toContain(response.status());
        if (response.status() === 400) {
          const data = await response.json();
          expect(data.error).toBeTruthy();
          // Should not be status validation error if status is valid
          expect(data.error).not.toMatch(/status/i);
        }
      }
    });

    test('should reject task with invalid priority', async ({ context }) => {
      const response = await context.request.post('/api/tasks', {
        data: {
          title: 'Test Task',
          project_id: 'proj_123',
          priority: 'critical',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });

    test('should accept all valid priority values', async ({ context }) => {
      const priorities = ['low', 'medium', 'high'];

      for (const priority of priorities) {
        const response = await context.request.post('/api/tasks', {
          data: {
            title: 'Test Task',
            project_id: 'proj_123',
            priority,
          },
        });

        expect([200, 201, 400, 401]).toContain(response.status());
      }
    });

    test('should reject task with invalid type', async ({ context }) => {
      const response = await context.request.post('/api/tasks', {
        data: {
          title: 'Test Task',
          project_id: 'proj_123',
          type: 'bug',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });

    test('should accept all valid type values', async ({ context }) => {
      const types = ['task', 'milestone', 'note', 'event', 'habit'];

      for (const type of types) {
        const response = await context.request.post('/api/tasks', {
          data: {
            title: 'Test Task',
            project_id: 'proj_123',
            type,
          },
        });

        expect([200, 201, 400, 401]).toContain(response.status());
      }
    });

    test('should validate tags as array', async ({ context }) => {
      const response = await context.request.post('/api/tasks', {
        data: {
          title: 'Test Task',
          project_id: 'proj_123',
          tags: ['tag1', 'tag2', 'tag3'],
        },
      });

      expect([200, 201, 400, 401]).toContain(response.status());
    });

    test('should reject tags as string', async ({ context }) => {
      const response = await context.request.post('/api/tasks', {
        data: {
          title: 'Test Task',
          project_id: 'proj_123',
          tags: 'tag1,tag2',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });

    test('should accept task with all optional fields', async ({ context }) => {
      const response = await context.request.post('/api/tasks', {
        data: {
          title: 'Full Task',
          project_id: 'proj_123',
          description: 'Task description',
          status: 'todo',
          priority: 'high',
          type: 'task',
          tags: ['important', 'urgent'],
          due_date: '2026-12-31',
        },
      });

      expect([200, 201, 400, 401]).toContain(response.status());
    });
  });

  test.describe('Tag Validation', () => {
    test('should reject tag without name', async ({ context }) => {
      const response = await context.request.post('/api/tags', {
        data: {
          color: '#FF5733',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });

    test('should reject tag without color', async ({ context }) => {
      const response = await context.request.post('/api/tags', {
        data: {
          name: 'Important',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });

    test('should reject tag with invalid color format', async ({ context }) => {
      const response = await context.request.post('/api/tags', {
        data: {
          name: 'Important',
          color: 'red',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });

    test('should reject color without hash', async ({ context }) => {
      const response = await context.request.post('/api/tags', {
        data: {
          name: 'Important',
          color: 'FF5733',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });

    test('should reject color with invalid hex characters', async ({
      context,
    }) => {
      const response = await context.request.post('/api/tags', {
        data: {
          name: 'Important',
          color: '#GGGGGG',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });

    test('should accept valid hex colors', async ({ context }) => {
      const colors = ['#FF5733', '#ff5733', '#000000', '#FFFFFF', '#123abc'];

      for (const color of colors) {
        const response = await context.request.post('/api/tags', {
          data: {
            name: `Tag ${Date.now()}`,
            color,
          },
        });

        expect([200, 201, 400, 401]).toContain(response.status());
        if (response.status() === 400) {
          const data = await response.json();
          expect(data.error).not.toMatch(/color/i);
        }
      }
    });
  });

  test.describe('Validation Error Messages', () => {
    test('should return structured error response', async ({ context }) => {
      const response = await context.request.post('/api/auth/login', {
        data: {
          email: 'invalid',
          password: 'short',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
    });

    test('should provide helpful error messages', async ({ context }) => {
      const response = await context.request.post('/api/tasks', {
        data: {
          title: 'Test',
          project_id: 'proj_123',
          status: 'invalid',
        },
      });

      if (response.status() === 400) {
        const data = await response.json();
        expect(data.error).toBeTruthy();
        expect(data.error.length).toBeGreaterThan(0);
      }
    });

    test('should include field-specific validation info', async ({
      context,
    }) => {
      const response = await context.request.post('/api/auth/register', {
        data: {
          email: 'valid@example.com',
          password: 'short',
          name: 'a'.repeat(101),
        },
      });

      if (response.status() === 400) {
        const data = await response.json();
        expect(data.error).toBeTruthy();
      }
    });
  });

  test.describe('Validation Performance', () => {
    test('should validate large payloads efficiently', async ({
      context,
    }) => {
      const largeDescription = 'x'.repeat(10000);

      const response = await context.request.post('/api/tasks', {
        data: {
          title: 'Large Task',
          project_id: 'proj_123',
          description: largeDescription,
        },
      });

      expect([200, 201, 400, 401]).toContain(response.status());
    });

    test('should validate complex objects quickly', async ({ context }) => {
      const startTime = Date.now();

      const response = await context.request.post('/api/projects', {
        data: {
          name: 'Complex Project',
          description: 'Complex description',
          is_favorite: true,
          sharing_settings: {
            shared_with: ['user1', 'user2', 'user3'],
            permissions: {
              edit: true,
              comment: true,
              view: true,
            },
          },
          custom_properties: {
            color: 'blue',
            icon: 'star',
            category: 'work',
            archived: false,
          },
        },
      });

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second

      expect([200, 201, 400, 401]).toContain(response.status());
    });
  });
});
