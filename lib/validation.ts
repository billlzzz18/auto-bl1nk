import { z } from 'zod';

export const authLoginSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร'),
});

export const authRegisterSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร'),
  name: z.string().min(1, 'กรุณากรอกชื่อ').max(100, 'ชื่อยาวเกินไป'),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, 'ชื่อโปรเจกต์ต้องไม่เว้นว่าง').max(100),
  description: z.string().optional().default(''),
  is_favorite: z.boolean().optional().default(false),
  sharing_settings: z.object({
    public_access: z.boolean().optional().default(false),
    password: z.string().optional(),
    expires_at: z.string().optional(),
    include_subpages: z.boolean().optional().default(false),
  }).optional(),
  custom_properties: z.array(z.record(z.unknown())).optional().default([]),
});

export const updateProjectSchema = z.object({
  name: z.string().max(100).optional(),
  description: z.string().optional(),
  is_favorite: z.boolean().optional(),
  sharing_settings: z.object({
    public_access: z.boolean().optional(),
    password: z.string().optional(),
    expires_at: z.string().optional(),
    include_subpages: z.boolean().optional(),
  }).optional(),
  custom_properties: z.array(z.record(z.unknown())).optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, 'ชื่องานต้องไม่เว้นว่าง').max(200),
  project_id: z.string().min(1, 'กรุณาระบุโปรเจกต์'),
  description: z.string().optional().default(''),
  status: z.enum(['backlog', 'todo', 'in_progress', 'review', 'done']).optional().default('todo'),
  due_date: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  type: z.enum(['task', 'milestone', 'note', 'event', 'habit']).optional().default('task'),
  estimated_time: z.number().optional(),
  actual_time: z.number().optional(),
  parent_id: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
});

export const updateTaskSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'review', 'done']).optional(),
  due_date: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  type: z.enum(['task', 'milestone', 'note', 'event', 'habit']).optional(),
  estimated_time: z.number().optional(),
  actual_time: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

export const createTagSchema = z.object({
  name: z.string().min(1, 'ชื่อแท็กต้องไม่เว้นว่าง').max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'สีต้องเป็นรูปแบบ hex (#RRGGBB)'),
});

export const createFolderSchema = z.object({
  name: z.string().min(1, 'ชื่อโฟลเดอร์ต้องไม่เว้นว่าง').max(100),
  parent_id: z.string().optional().nullable(),
});

export const createWebhookSchema = z.object({
  url: z.string().url('URL ไม่ถูกต้อง'),
  events: z.array(z.string()).min(1, 'กรุณาเลือก event อย่างน้อย 1 รายการ'),
});

export const createCommentSchema = z.object({
  task_id: z.string().min(1, 'ต้องระบุ task ID'),
  text: z.string().min(1, 'ความเห็นต้องไม่เว้นว่าง').max(1000),
});

export const createApiKeySchema = z.object({
  name: z.string().min(1, 'ชื่อ key ต้องไม่เว้นว่าง').max(100),
});

export const createAutomationSchema = z.object({
  project_id: z.string().min(1, 'ต้องระบุ project ID'),
  trigger_event: z.enum(['status_changed', 'moved_to_folder', 'new_task', 'date_reached']),
  condition_field: z.string().optional(),
  condition_value: z.string().optional(),
  action_type: z.enum(['webhook', 'notification', 'change_assignee', 'add_tag', 'remove_tag', 'email']),
  action_value: z.string().min(1, 'action value ต้องไม่เว้นว่าง'),
});

export const createExtensionSchema = z.object({
  name: z.string().min(1).max(100),
  version: z.string().min(1).max(50),
  author: z.string().min(1).max(100),
  type: z.enum(['theme', 'block', 'worker', 'shortcut', 'template', 'chart']),
  code: z.string().min(1, 'code ต้องไม่เว้นว่าง'),
});

// Type exports for TypeScript
export type AuthLoginInput = z.infer<typeof authLoginSchema>;
export type AuthRegisterInput = z.infer<typeof authRegisterSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type CreateAutomationInput = z.infer<typeof createAutomationSchema>;
export type CreateExtensionInput = z.infer<typeof createExtensionSchema>;
