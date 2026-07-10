import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * SQL-aligned database abstraction for the new Drizzle schema.
 *
 * The legacy JSON-backed database API is preserved for existing routes,
 * but the shape now matches the SQL tables added in the project:
 * user, session, account, verification, chat, and chat_event.
 */

export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  name: string;
  bio?: string;
  avatar?: string;
  google_connected?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
  updated_at?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface Account {
  id: string;
  user_id: string;
  provider_id: string;
  account_id: string;
  password?: string;
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
  created_at: string;
  updated_at?: string;
}

export interface Verification {
  id: string;
  identifier: string;
  value: string;
  expires_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface Chat {
  id: string;
  user_id: string;
  title: string;
  eve_session?: Record<string, unknown> | null;
  pending_user_message?: string | null;
  pending_user_message_created_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ChatEvent {
  id: string;
  chat_id: string;
  event_index: number;
  event: Record<string, unknown>;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  user_id: string;
  is_favorite: boolean;
  sharing_settings: {
    public_access: boolean;
    password?: string;
    expires_at?: string;
    include_subpages: boolean;
  };
  custom_properties: Array<{ name: string; type: string; value?: any }>;
  created_at: string;
  drive_folder_id?: string;
  drive_folder_link?: string;
  folder_id?: string | null;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_name: string;
  text: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  project_id: string;
  user_id: string;
  description: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  due_date: string;
  start_time?: string;
  end_time?: string;
  priority: 'low' | 'medium' | 'high';
  type: 'task' | 'milestone' | 'note' | 'event' | 'habit';
  estimated_time?: number;
  actual_time?: number;
  parent_id?: string;
  tags: string[];
  comments?: TaskComment[];
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  user_id: string;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id: string;
}

export interface TagRule {
  id: string;
  type: 'restricted' | 'prefix' | 'folder' | 'length_constraint';
  folder_id?: string;
  rule_value: string;
  user_id: string;
}

export interface Automation {
  id: string;
  project_id: string;
  trigger_event: 'status_changed' | 'moved_to_folder' | 'new_task' | 'date_reached';
  condition_field?: string;
  condition_value?: string;
  action_type: 'webhook' | 'notification' | 'change_assignee' | 'add_tag' | 'remove_tag' | 'email';
  action_value: string;
  isActive: boolean;
  user_id: string;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  user_id: string;
  created_at: string;
}

export interface ApiKey {
  id: string;
  key: string;
  masked_key: string;
  name: string;
  user_id: string;
  created_at: string;
}

export interface TrashItem {
  id: string;
  item_type: 'project' | 'task' | 'note' | 'folder';
  item_id: string;
  item_data: any;
  deleted_at: string;
  user_id: string;
}

export interface Extension {
  id: string;
  name: string;
  version: string;
  author: string;
  type: 'theme' | 'block' | 'worker' | 'shortcut' | 'template' | 'chart';
  code: string;
  is_enabled: boolean;
  user_id: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  activity: string;
  timestamp: string;
}

export interface DbStructure {
  users: User[];
  sessions: Session[];
  accounts: Account[];
  verifications: Verification[];
  chats: Chat[];
  chatEvents: ChatEvent[];
  projects: Project[];
  tasks: Task[];
  folders: Folder[];
  tags: Tag[];
  tagRules: TagRule[];
  automations: Automation[];
  webhooks: Webhook[];
  apiKeys: ApiKey[];
  trash: TrashItem[];
  extensions: Extension[];
  activityLogs: ActivityLog[];
}

const DB_FILE_PATH = path.join(process.cwd(), 'database.json');

function createInitialDb(): DbStructure {
  const now = new Date().toISOString();
  const passwordHash = crypto.createHash('sha256').update('bl1nkOS2026').digest('hex');

  return {
    users: [
      {
        id: 'alex_morgan',
        email: 'alex@bl1nk.io',
        passwordHash,
        name: 'Alex Morgan',
        bio: 'Creative Director at bl1nk technologies.',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        google_connected: true,
        created_at: now,
        updated_at: now,
      },
    ],
    sessions: [],
    accounts: [
      {
        id: 'acct_alex',
        user_id: 'alex_morgan',
        provider_id: 'credential',
        account_id: 'alex_morgan',
        password: passwordHash,
        created_at: now,
        updated_at: now,
      },
    ],
    verifications: [],
    chats: [],
    chatEvents: [],
    projects: [],
    tasks: [],
    folders: [],
    tags: [],
    tagRules: [],
    automations: [],
    webhooks: [],
    apiKeys: [],
    trash: [],
    extensions: [],
    activityLogs: [],
  };
}

function normalizeDb(db: Partial<DbStructure> | null | undefined): DbStructure {
  const base = createInitialDb();
  const current = db ?? {};

  return {
    users: current.users ?? base.users,
    sessions: current.sessions ?? base.sessions,
    accounts: current.accounts ?? base.accounts,
    verifications: current.verifications ?? base.verifications,
    chats: current.chats ?? base.chats,
    chatEvents: current.chatEvents ?? base.chatEvents,
    projects: current.projects ?? base.projects,
    tasks: current.tasks ?? base.tasks,
    folders: current.folders ?? base.folders,
    tags: current.tags ?? base.tags,
    tagRules: current.tagRules ?? base.tagRules,
    automations: current.automations ?? base.automations,
    webhooks: current.webhooks ?? base.webhooks,
    apiKeys: current.apiKeys ?? base.apiKeys,
    trash: current.trash ?? base.trash,
    extensions: current.extensions ?? base.extensions,
    activityLogs: current.activityLogs ?? base.activityLogs,
  };
}

class DatabaseManager {
  private db: DbStructure | null = null;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf8');
        this.db = normalizeDb(JSON.parse(raw));
      } else {
        this.db = createInitialDb();
        this.saveSync();
      }
    } catch {
      this.db = createInitialDb();
      this.saveSync();
    }
  }

  private saveSync() {
    if (this.db) {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.db, null, 2), 'utf8');
    }
  }

  public getDb(): DbStructure {
    if (!this.db) {
      this.init();
    }
    return this.db!;
  }

  public save(db: DbStructure) {
    this.db = normalizeDb(db);
    this.saveSync();
  }
}

const dbManager = new DatabaseManager();

export function getDb(): DbStructure {
  return dbManager.getDb();
}

export function saveDb(db: DbStructure): void {
  dbManager.save(db);
}

export function createUser(input: Partial<User> & Pick<User, 'email' | 'name'>): User {
  const now = new Date().toISOString();
  const userId = input.id ?? `user_${Math.random().toString(36).slice(2, 10)}`;

  return {
    id: userId,
    email: input.email,
    passwordHash: input.passwordHash,
    name: input.name,
    bio: input.bio ?? '',
    avatar: input.avatar ?? '',
    google_connected: input.google_connected ?? false,
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
  };
}

export function createSession(input: Omit<Session, 'id' | 'created_at'> & { id?: string }): Session {
  const now = new Date().toISOString();

  return {
    id: input.id ?? `sess_${Math.random().toString(36).slice(2, 10)}`,
    user_id: input.user_id,
    token: input.token,
    expires_at: input.expires_at,
    created_at: now,
    updated_at: input.updated_at ?? now,
    ip_address: input.ip_address,
    user_agent: input.user_agent,
  };
}

export function createChat(input: Omit<Chat, 'id' | 'created_at'> & { id?: string }): Chat {
  const now = new Date().toISOString();

  return {
    id: input.id ?? `chat_${Math.random().toString(36).slice(2, 10)}`,
    user_id: input.user_id,
    title: input.title,
    eve_session: input.eve_session ?? null,
    pending_user_message: input.pending_user_message ?? null,
    pending_user_message_created_at: input.pending_user_message_created_at ?? null,
    created_at: now,
    updated_at: input.updated_at ?? now,
  };
}

export function createChatEvent(input: Omit<ChatEvent, 'id' | 'created_at'> & { id?: string }): ChatEvent {
  const now = new Date().toISOString();

  return {
    id: input.id ?? `evt_${Math.random().toString(36).slice(2, 10)}`,
    chat_id: input.chat_id,
    event_index: input.event_index,
    event: input.event,
    created_at: now,
  };
}

export function findUserByEmail(email: string): User | null {
  return getDb().users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function findUserById(userId: string): User | null {
  return getDb().users.find((user) => user.id === userId) ?? null;
}

// Compatibility helpers for the older task/project routes.
export function isTimeConflicting(
  userId: string,
  date: string,
  start: string,
  end: string,
  excludeTaskId?: string,
): boolean {
  if (!start || !end || !date) return false;

  const db = getDb();
  const toMinutes = (timeStr: string) => {
    const [hour, minute] = timeStr.split(':').map(Number);
    return hour * 60 + minute;
  };

  const newStartMin = toMinutes(start);
  const newEndMin = toMinutes(end);

  return db.tasks.some((task) => {
    if (task.user_id !== userId || task.id === excludeTaskId || task.due_date !== date) {
      return false;
    }

    if (!task.start_time || !task.end_time || task.status === 'done') {
      return false;
    }

    const taskStartMin = toMinutes(task.start_time);
    const taskEndMin = toMinutes(task.end_time);

    return newStartMin < taskEndMin && taskStartMin < newEndMin;
  });
}

export function validateAndProcessTags(userId: string, tags: string[]): { error?: string; processedTags: string[] } {
  const db = getDb();
  const rules = db.tagRules.filter((rule) => rule.user_id === userId);
  let processedTags = [...tags];

  for (const rule of rules) {
    if (rule.type === 'restricted') {
      const restrictedTagName = rule.rule_value;
      if (processedTags.some((tag) => tag.toLowerCase() === restrictedTagName.toLowerCase())) {
        return { error: `แท็ก "${restrictedTagName}" เป็นแท็กที่ถูกห้ามใช้`, processedTags };
      }
    }

    if (rule.type === 'length_constraint') {
      const maxLen = Number.parseInt(rule.rule_value, 10);
      if (!Number.isNaN(maxLen)) {
        for (const tag of processedTags) {
          if (tag.length > maxLen) {
            return { error: `ชื่อแท็ก "${tag}" ขนาดยาวเกินข้อจำกัดสูงสุด ${maxLen} ตัวอักษร`, processedTags };
          }
        }
      }
    }

    if (rule.type === 'prefix') {
      const prefix = rule.rule_value;
      processedTags = processedTags.map((tag) => {
        if (!tag.startsWith(prefix) && tag.toLowerCase().includes('dev')) {
          return `${prefix}${tag}`;
        }
        return tag;
      });
    }
  }

  return { processedTags: Array.from(new Set(processedTags)) };
}

export function triggerSystemEvents(userId: string, event: string, data: any): void {
  const db = getDb();
  const timestamp = new Date().toISOString();
  const logId = `log_${Math.random().toString(36).slice(2, 8)}`;

  db.activityLogs.unshift({
    id: logId,
    user_id: userId,
    activity: event === 'task.created'
      ? `Created task "${data?.title ?? 'task'}"`
      : `Triggered ${event}`,
    timestamp,
  });

  if (db.activityLogs.length > 200) {
    db.activityLogs = db.activityLogs.slice(0, 100);
  }

  saveDb(db);
}
