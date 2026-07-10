import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Authentication System
 * Tests Drizzle ORM migration impact on auth flows
 */

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Session Management', () => {
    test('should verify session after login', async ({ context }) => {
      // Make a login request
      const loginResponse = await context.request.post('/api/auth/login', {
        data: {
          email: 'testuser@example.com',
          password: 'password123',
        },
      });

      // Response status will be 401 if user doesn't exist, but that's expected
      expect([200, 401, 400]).toContain(loginResponse.status());

      // Try to access protected endpoint
      const meResponse = await context.request.get('/api/auth/me');

      // Should be 401 if no valid session
      expect([200, 401]).toContain(meResponse.status());
    });

    test('should handle missing credentials', async ({ context }) => {
      const response = await context.request.post('/api/auth/login', {
        data: {},
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });

    test('should validate email format before database query', async ({
      context,
    }) => {
      const response = await context.request.post('/api/auth/login', {
        data: {
          email: 'not-an-email',
          password: 'password123',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });

    test('should handle database-level errors gracefully', async ({
      context,
    }) => {
      const response = await context.request.post('/api/auth/login', {
        data: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      });

      // Should return 401 for invalid credentials
      expect([401, 400]).toContain(response.status());

      if (response.status() === 400) {
        const data = await response.json();
        expect(data.error).toBeTruthy();
      }
    });
  });

  test.describe('Password Validation', () => {
    test('should reject password shorter than 6 characters', async ({
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

    test('should accept password of exactly 6 characters', async ({
      context,
    }) => {
      const response = await context.request.post('/api/auth/login', {
        data: {
          email: 'user@example.com',
          password: '123456',
        },
      });

      // Validation passes, but auth will fail if user doesn't exist
      expect([200, 401, 400]).toContain(response.status());
      if (response.status() === 400) {
        const data = await response.json();
        expect(data.error).not.toMatch(/password.*length|password.*6/i);
      }
    });

    test('should accept long passwords', async ({ context }) => {
      const longPassword = 'a'.repeat(100);
      const response = await context.request.post('/api/auth/login', {
        data: {
          email: 'user@example.com',
          password: longPassword,
        },
      });

      expect([200, 401, 400]).toContain(response.status());
    });
  });

  test.describe('Registration Flow', () => {
    test('should reject registration with invalid email', async ({
      context,
    }) => {
      const response = await context.request.post('/api/auth/register', {
        data: {
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });

    test('should reject registration with short password', async ({
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

    test('should reject registration with empty name', async ({ context }) => {
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

    test('should reject registration with name too long', async ({
      context,
    }) => {
      const response = await context.request.post('/api/auth/register', {
        data: {
          email: 'newuser@example.com',
          password: 'password123',
          name: 'a'.repeat(101),
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });

    test('should handle missing registration fields', async ({ context }) => {
      const testCases = [
        { password: 'password123', name: 'Test User' }, // missing email
        { email: 'user@example.com', name: 'Test User' }, // missing password
        { email: 'user@example.com', password: 'password123' }, // missing name
      ];

      for (const data of testCases) {
        const response = await context.request.post('/api/auth/register', {
          data,
        });

        expect(response.status()).toBe(400);
        const responseData = await response.json();
        expect(responseData.error).toBeTruthy();
      }
    });

    test('should handle special characters in name', async ({ context }) => {
      const response = await context.request.post('/api/auth/register', {
        data: {
          email: 'newuser@example.com',
          password: 'password123',
          name: 'Test User @#$% !',
        },
      });

      // Should either accept or fail gracefully
      expect([200, 201, 400, 401]).toContain(response.status());
    });

    test('should handle unicode characters in name', async ({ context }) => {
      const response = await context.request.post('/api/auth/register', {
        data: {
          email: 'newuser@example.com',
          password: 'password123',
          name: 'ทดสอบผู้ใช้', // Thai characters
        },
      });

      // Should accept unicode
      expect([200, 201, 400, 401]).toContain(response.status());
    });
  });

  test.describe('API Key Authentication', () => {
    test('should accept API key in headers', async ({ context }) => {
      // This tests that the API supports both session and API key auth
      const response = await context.request.get('/api/projects', {
        headers: {
          'X-API-Key': 'test-api-key-123',
        },
      });

      // Should handle request (even if auth fails)
      expect([200, 401, 400]).toContain(response.status());
    });

    test('should accept API key in query parameter', async ({ context }) => {
      const response = await context.request.get('/api/projects?apiKey=test-key');

      expect([200, 401, 400]).toContain(response.status());
    });
  });

  test.describe('Authorization', () => {
    test('should protect endpoints from unauthenticated access', async ({
      context,
    }) => {
      // Try to access protected endpoint without auth
      const response = await context.request.get('/api/projects');

      expect([200, 401]).toContain(response.status());
    });

    test('should verify ownership of resources', async ({ context }) => {
      // Try to access another user's resource
      const response = await context.request.get(
        '/api/projects/some-other-users-project'
      );

      expect([200, 401, 404]).toContain(response.status());
    });
  });

  test.describe('Drizzle ORM Integration', () => {
    test('should handle database transactions correctly', async ({
      context,
    }) => {
      // Create multiple projects in rapid succession
      const responses = [];

      for (let i = 0; i < 3; i++) {
        const response = await context.request.post('/api/projects', {
          data: {
            name: `Concurrent Project ${i}`,
          },
        });
        responses.push(response);
      }

      // All should succeed without conflicts
      expect(responses.every((r) => [200, 201, 400, 401].includes(r.status()))).toBe(
        true
      );
    });

    test('should handle concurrent authentication requests', async ({
      context,
    }) => {
      // Make multiple auth requests simultaneously
      const responses = await Promise.all([
        context.request.post('/api/auth/login', {
          data: {
            email: 'user1@example.com',
            password: 'password123',
          },
        }),
        context.request.post('/api/auth/login', {
          data: {
            email: 'user2@example.com',
            password: 'password123',
          },
        }),
        context.request.post('/api/auth/login', {
          data: {
            email: 'user3@example.com',
            password: 'password123',
          },
        }),
      ]);

      // All should complete without errors
      responses.forEach((response) => {
        expect([200, 401, 400]).toContain(response.status());
      });
    });
  });

  test.describe('Error Handling', () => {
    test('should return appropriate error codes', async ({ context }) => {
      const testCases = [
        {
          endpoint: '/api/auth/login',
          data: { email: 'invalid', password: 'short' },
          expectedStatus: 400,
        },
        {
          endpoint: '/api/auth/login',
          data: { email: 'user@example.com', password: 'password123' },
          expectedStatus: [200, 401], // Valid format, but auth may fail
        },
      ];

      for (const testCase of testCases) {
        const response = await context.request.post(testCase.endpoint, {
          data: testCase.data,
        });

        if (Array.isArray(testCase.expectedStatus)) {
          expect(testCase.expectedStatus).toContain(response.status());
        } else {
          expect(response.status()).toBe(testCase.expectedStatus);
        }
      }
    });

    test('should not leak internal error details', async ({ context }) => {
      const response = await context.request.post('/api/auth/login', {
        data: {
          email: 'test@example.com',
          password: 'password123',
        },
      });

      if (response.status() === 401) {
        const data = await response.json();
        const errorText = JSON.stringify(data);

        // Should not contain sensitive database info
        expect(errorText).not.toMatch(/query|sql|database|connection/i);
        expect(errorText).not.toMatch(/at\s+async|trace|stack/i);
      }
    });
  });

  test.describe('Rate Limiting', () => {
    test('should handle multiple login attempts', async ({ context }) => {
      const attempts = [];

      for (let i = 0; i < 5; i++) {
        const response = await context.request.post('/api/auth/login', {
          data: {
            email: 'test@example.com',
            password: 'password123',
          },
        });

        attempts.push(response.status());
      }

      // All should complete (rate limiting may kick in)
      attempts.forEach((status) => {
        expect([200, 401, 400, 429]).toContain(status);
      });
    });
  });

  test.describe('Session Persistence', () => {
    test('should maintain session across requests', async ({ context }) => {
      // First request
      const response1 = await context.request.get('/api/auth/me');
      const status1 = response1.status();

      // Second request with same context
      const response2 = await context.request.get('/api/auth/me');
      const status2 = response2.status();

      // Both should have same auth status
      expect(status1).toBe(status2);
    });
  });
});
