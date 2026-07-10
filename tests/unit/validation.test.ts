import { describe, it, expect } from '@jest/globals';
import {
  authLoginSchema,
  authRegisterSchema,
  createProjectSchema,
  createTaskSchema,
  createTagSchema,
  createFolderSchema,
} from '@/lib/validation';

describe('Validation Schemas', () => {
  describe('authLoginSchema', () => {
    it('should validate correct login data', () => {
      const data = {
        email: 'user@example.com',
        password: 'password123',
      };
      const result = authLoginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const data = {
        email: 'invalid-email',
        password: 'password123',
      };
      const result = authLoginSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].code).toBe('invalid_string');
      }
    });

    it('should reject password shorter than 6 characters', () => {
      const data = {
        email: 'user@example.com',
        password: 'pass',
      };
      const result = authLoginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing email', () => {
      const data = {
        password: 'password123',
      };
      const result = authLoginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const data = {
        email: 'user@example.com',
      };
      const result = authLoginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('authRegisterSchema', () => {
    it('should validate correct registration data', () => {
      const data = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'John Doe',
      };
      const result = authRegisterSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject password shorter than 6 characters', () => {
      const data = {
        email: 'newuser@example.com',
        password: 'pass',
        name: 'John Doe',
      };
      const result = authRegisterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject name longer than 100 characters', () => {
      const data = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'a'.repeat(101),
      };
      const result = authRegisterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const data = {
        email: 'newuser@example.com',
        password: 'password123',
        name: '',
      };
      const result = authRegisterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const data = {
        email: 'not-an-email',
        password: 'password123',
        name: 'John Doe',
      };
      const result = authRegisterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('createProjectSchema', () => {
    it('should validate minimal project data', () => {
      const data = {
        name: 'My Project',
      };
      const result = createProjectSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate full project data', () => {
      const data = {
        name: 'My Project',
        description: 'A test project',
        is_favorite: true,
        sharing_settings: { shared_with: ['user1', 'user2'] },
        custom_properties: { color: 'blue', icon: 'star' },
      };
      const result = createProjectSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject missing name', () => {
      const data = {
        description: 'A test project',
      };
      const result = createProjectSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const data = {
        name: '',
      };
      const result = createProjectSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should allow optional fields', () => {
      const data = {
        name: 'My Project',
        description: 'A test project',
      };
      const result = createProjectSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_favorite).toBeUndefined();
      }
    });
  });

  describe('createTaskSchema', () => {
    it('should validate minimal task data', () => {
      const data = {
        title: 'Test Task',
        project_id: 'proj_123',
      };
      const result = createTaskSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate full task data', () => {
      const data = {
        title: 'Test Task',
        project_id: 'proj_123',
        description: 'Task description',
        status: 'todo' as const,
        priority: 'high' as const,
        type: 'task' as const,
        tags: ['tag1', 'tag2'],
        due_date: '2026-12-31',
      };
      const result = createTaskSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate all status values', () => {
      const statuses = ['backlog', 'todo', 'in_progress', 'review', 'done'] as const;
      statuses.forEach((status) => {
        const data = {
          title: 'Test Task',
          project_id: 'proj_123',
          status,
        };
        const result = createTaskSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should validate all priority values', () => {
      const priorities = ['low', 'medium', 'high'] as const;
      priorities.forEach((priority) => {
        const data = {
          title: 'Test Task',
          project_id: 'proj_123',
          priority,
        };
        const result = createTaskSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should validate all type values', () => {
      const types = ['task', 'milestone', 'note', 'event', 'habit'] as const;
      types.forEach((type) => {
        const data = {
          title: 'Test Task',
          project_id: 'proj_123',
          type,
        };
        const result = createTaskSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid status', () => {
      const data = {
        title: 'Test Task',
        project_id: 'proj_123',
        status: 'invalid_status',
      };
      const result = createTaskSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid priority', () => {
      const data = {
        title: 'Test Task',
        project_id: 'proj_123',
        priority: 'critical',
      };
      const result = createTaskSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid type', () => {
      const data = {
        title: 'Test Task',
        project_id: 'proj_123',
        type: 'bug',
      };
      const result = createTaskSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing title', () => {
      const data = {
        project_id: 'proj_123',
      };
      const result = createTaskSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing project_id', () => {
      const data = {
        title: 'Test Task',
      };
      const result = createTaskSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept tags as array', () => {
      const data = {
        title: 'Test Task',
        project_id: 'proj_123',
        tags: ['tag1', 'tag2', 'tag3'],
      };
      const result = createTaskSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data.tags)).toBe(true);
      }
    });

    it('should reject tags as non-array', () => {
      const data = {
        title: 'Test Task',
        project_id: 'proj_123',
        tags: 'tag1,tag2',
      };
      const result = createTaskSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('createTagSchema', () => {
    it('should validate tag with valid hex color', () => {
      const data = {
        name: 'Important',
        color: '#FF5733',
      };
      const result = createTagSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate lowercase hex color', () => {
      const data = {
        name: 'Important',
        color: '#ff5733',
      };
      const result = createTagSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid color format', () => {
      const data = {
        name: 'Important',
        color: 'red',
      };
      const result = createTagSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject color without #', () => {
      const data = {
        name: 'Important',
        color: 'FF5733',
      };
      const result = createTagSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject color with too few characters', () => {
      const data = {
        name: 'Important',
        color: '#FF5',
      };
      const result = createTagSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject color with invalid hex characters', () => {
      const data = {
        name: 'Important',
        color: '#GGGGGG',
      };
      const result = createTagSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing name', () => {
      const data = {
        color: '#FF5733',
      };
      const result = createTagSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing color', () => {
      const data = {
        name: 'Important',
      };
      const result = createTagSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('createFolderSchema', () => {
    it('should validate folder with name', () => {
      const data = {
        name: 'My Folder',
      };
      const result = createFolderSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate folder with parent_id', () => {
      const data = {
        name: 'My Folder',
        parent_id: 'folder_123',
      };
      const result = createFolderSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject missing name', () => {
      const data = {
        parent_id: 'folder_123',
      };
      const result = createFolderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const data = {
        name: '',
      };
      const result = createFolderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
