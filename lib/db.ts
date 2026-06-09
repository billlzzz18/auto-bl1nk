import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * JSDoc: โครงสร้างข้อมูลสำหรับฐานข้อมูลส่วนตัว bl1nk ink
 * รองรับ Row-Level isolation (RLS), Tag Rules, Automations, Conflicts, และ Seed Data
 */

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  bio: string;
  avatar: string;
  google_connected: boolean;
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
}

export interface Task {
  id: string; // BL1NK-XXXX
  title: string;
  project_id: string;
  user_id: string;
  description: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  due_date: string; // YYYY-MM-DD
  start_time?: string; // HH:MM
  end_time?: string; // HH:MM
  priority: 'low' | 'medium' | 'high';
  type: 'task' | 'milestone' | 'note' | 'event' | 'habit';
  estimated_time?: number; // minutes
  actual_time?: number; // minutes
  parent_id?: string;
  tags: string[]; // tag names
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
  color: string; // Hex color
  user_id: string;
}

export interface TagRule {
  id: string;
  type: 'restricted' | 'prefix' | 'folder' | 'length_constraint';
  folder_id?: string; // For restricted, prefix, folder inherit rules
  rule_value: string; // Regex, prefix name, tag list, or number string
  user_id: string;
}

export interface Automation {
  id: string;
  project_id: string;
  trigger_event: 'status_changed' | 'moved_to_folder' | 'new_task' | 'date_reached';
  condition_field?: string;
  condition_value?: string;
  action_type: 'webhook' | 'notification' | 'change_assignee' | 'add_tag' | 'remove_tag' | 'email';
  action_value: string; // Webhook URL, tag name, etc.
  isActive: boolean;
  user_id: string;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[]; // task.created, task.updated, etc.
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
  code: string; // CSS variables or script code
  is_enabled: boolean;
  user_id: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  activity: string;
  timestamp: string;
}

// โครงสร้าง Database ทั้งหมด
export interface DbStructure {
  users: User[];
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

// ข้อมูล Seed เริ่มต้นสำหรับโปรเจกต์
const INITIAL_DB: DbStructure = {
  users: [
    {
      id: 'alex_morgan',
      email: 'alex@bl1nk.io',
      // password คือ bl1nkOS2026 (ระบบความเสถียรขั้นสูง)
      passwordHash: crypto.createHash('sha256').update('bl1nkOS2026').digest('hex'),
      name: 'Alex Morgan',
      bio: 'Creative Director at bl1nk technologies. Crafting the modular operating system of the future.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      google_connected: true,
      created_at: '2026-01-01T00:00:00Z',
    }
  ],
  projects: [
    {
      id: 'proj_cyber',
      name: 'Cybernetic UI Kit',
      description: 'The definitive premium component designs for atmospheric cybernetic user interfaces.',
      user_id: 'alex_morgan',
      is_favorite: true,
      sharing_settings: {
        public_access: true,
        include_subpages: true,
      },
      custom_properties: [
        { name: 'Complexity', type: 'select', value: 'High' },
        { name: 'Target Framework', type: 'select', value: 'React' }
      ],
      created_at: '2026-05-10T10:00:00Z'
    },
    {
      id: 'proj_brand',
      name: 'Global Brand Assets',
      description: 'Curated vector assets and high-fidelity specifications for world-class design systems.',
      user_id: 'alex_morgan',
      is_favorite: true,
      sharing_settings: {
        public_access: true,
        include_subpages: false,
      },
      custom_properties: [
        { name: 'Asset Density', type: 'number', value: 8 },
        { name: 'Visual Mood', type: 'text', value: 'Luxurious Minimialism' }
      ],
      created_at: '2026-05-15T09:00:00Z'
    },
    {
      id: 'proj_wellness',
      name: 'Wellness 2026',
      description: 'Habit tracking and time-boxing engine for balanced physical and cognitive wellness.',
      user_id: 'alex_morgan',
      is_favorite: false,
      sharing_settings: {
        public_access: false,
        include_subpages: false,
      },
      custom_properties: [
        { name: 'Target Frequency', type: 'text', value: 'Daily' }
      ],
      created_at: '2026-05-20T12:00:00Z'
    }
  ],
  tasks: [
    // Tasks: Cybernetic UI Kit (12 งาน)
    {
      id: 'BL1NK-1001',
      title: 'Define atmospheric neon design vectors',
      project_id: 'proj_cyber',
      user_id: 'alex_morgan',
      description: 'Establish precise gradients and drop-shading rules for glow and neon styling vectors.',
      status: 'done',
      due_date: '2026-05-25',
      priority: 'high',
      type: 'task',
      tags: ['Design', 'Urgent'],
      created_at: '2026-05-10T11:00:00Z',
      updated_at: '2026-05-25T17:00:00Z'
    },
    {
      id: 'BL1NK-1002',
      title: 'Core glassmorphism blur styles',
      project_id: 'proj_cyber',
      user_id: 'alex_morgan',
      description: 'Implement glassmorphism tailwind layer utilities supporting backdrop-filter 25px.',
      status: 'done',
      due_date: '2026-05-28',
      priority: 'medium',
      type: 'task',
      tags: ['Design'],
      created_at: '2026-05-11T11:00:00Z',
      updated_at: '2026-05-28T16:00:00Z'
    },
    {
      id: 'BL1NK-1003',
      title: 'Interactive keyboard shortcuts framework',
      project_id: 'proj_cyber',
      user_id: 'alex_morgan',
      description: 'Map global Cmd+K event listener hooks to focus-aware command palettes.',
      status: 'in_progress',
      due_date: '2026-06-02',
      priority: 'high',
      type: 'task',
      tags: ['Dev'],
      created_at: '2026-05-12T10:00:00Z',
      updated_at: '2026-06-02T15:00:00Z'
    },
    {
      id: 'BL1NK-1004',
      title: 'Construct lobui core tabs utility',
      project_id: 'proj_cyber',
      user_id: 'alex_morgan',
      description: 'Refined customizable tab navigation featuring a fading momentum slide bar.',
      status: 'todo',
      due_date: '2026-06-05',
      priority: 'medium',
      type: 'task',
      tags: ['Dev', 'Feature'],
      created_at: '2026-05-13T10:00:00Z',
      updated_at: '2026-05-13T10:00:00Z'
    },
    {
      id: 'BL1NK-1005',
      title: 'Create icon set for cyber ui',
      project_id: 'proj_cyber',
      user_id: 'alex_morgan',
      description: 'Custom vectors representing AI brands (Gemini, Anthropic) and general system controls.',
      status: 'todo',
      due_date: '2026-06-07',
      priority: 'low',
      type: 'task',
      tags: ['Design', 'Feature'],
      created_at: '2026-05-14T09:00:00Z',
      updated_at: '2026-05-14T09:00:00Z'
    },
    {
      id: 'BL1NK-1006',
      title: 'Establish global responsive sidebars',
      project_id: 'proj_cyber',
      user_id: 'alex_morgan',
      description: 'Write reactive Media Queries collapsing desktop layouts safely into a slideup sheet on mobile targets.',
      status: 'done',
      due_date: '2026-05-29',
      priority: 'high',
      type: 'task',
      tags: ['Dev', 'Design'],
      created_at: '2026-05-15T09:00:00Z',
      updated_at: '2026-05-29T18:00:00Z'
    },
    {
      id: 'BL1NK-1007',
      title: 'Optimize momentum scrolling animations',
      project_id: 'proj_cyber',
      user_id: 'alex_morgan',
      description: 'Damping effect calculations utilizing Framer Motion physics variables.',
      status: 'backlog',
      due_date: '2026-06-15',
      priority: 'low',
      type: 'task',
      tags: ['Design'],
      created_at: '2026-05-16T14:00:00Z',
      updated_at: '2026-05-16T14:00:00Z'
    },
    {
      id: 'BL1NK-1008',
      title: 'Integration layer with Slack webhooks',
      project_id: 'proj_cyber',
      user_id: 'alex_morgan',
      description: 'Automate push pipelines dispatching status payloads instantly to #design-activity channel.',
      status: 'done',
      due_date: '2026-05-30',
      priority: 'medium',
      type: 'task',
      tags: ['Integration'],
      created_at: '2026-05-17T11:00:00Z',
      updated_at: '2026-05-30T10:00:00Z'
    },
    {
      id: 'BL1NK-1009',
      title: 'Document system variables layout',
      project_id: 'proj_cyber',
      user_id: 'alex_morgan',
      description: 'Publish complete list of CSS design tokens onto local documentation sub-pages.',
      status: 'backlog',
      due_date: '2026-06-20',
      priority: 'low',
      type: 'task',
      tags: ['Documentation'],
      created_at: '2026-05-18T12:00:00Z',
      updated_at: '2026-05-18T12:00:00Z'
    },
    {
      id: 'BL1NK-1010',
      title: 'User access role schema audit',
      project_id: 'proj_cyber',
      user_id: 'alex_morgan',
      description: 'Rigorous token testing confirming absolute isolation across tenants.',
      status: 'done',
      due_date: '2026-05-24',
      priority: 'high',
      type: 'task',
      tags: ['Planning', 'Dev'],
      created_at: '2026-05-10T10:00:00Z',
      updated_at: '2026-05-24T15:00:00Z'
    },
    {
      id: 'BL1NK-1011',
      title: 'Formulate responsive multi-views switcher',
      project_id: 'proj_cyber',
      user_id: 'alex_morgan',
      description: 'Ensure synchronicity of underlying dataset in (<100ms) with multiple viewport representations.',
      status: 'review',
      due_date: '2026-06-03',
      priority: 'high',
      type: 'task',
      tags: ['Dev', 'Feature'],
      created_at: '2026-05-11T12:00:00Z',
      updated_at: '2026-06-02T16:00:00Z'
    },
    {
      id: 'BL1NK-1012',
      title: 'Review custom Tag constraints solver',
      project_id: 'proj_cyber',
      user_id: 'alex_morgan',
      description: 'Deploy real-time pattern validation supporting Prefix, Restricted checks, and maximum tag length limits.',
      status: 'review',
      due_date: '2026-06-04',
      priority: 'medium',
      type: 'task',
      tags: ['Planning', 'Dev'],
      created_at: '2026-05-12T15:00:00Z',
      updated_at: '2026-06-02T16:30:00Z'
    },

    // Global Brand Assets Database (8 cards, used on grid)
    {
      id: 'BL1NK-2001',
      title: 'Apple Visual Assets',
      project_id: 'proj_brand',
      user_id: 'alex_morgan',
      description: 'Review Apple design aesthetics, crisp vector apple logos, dark glass card layouts, and premium san-serif layouts.',
      status: 'done',
      due_date: '2026-05-22',
      priority: 'high',
      type: 'note',
      tags: ['Research', 'Marketing'],
      created_at: '2026-05-15T09:30:00Z',
      updated_at: '2026-05-22T10:00:00Z'
    },
    {
      id: 'BL1NK-2002',
      title: 'Google branding guide',
      project_id: 'proj_brand',
      user_id: 'alex_morgan',
      description: 'Analysis of flat playful shadows, Google Product Sans display typography, responsive geometric alignments.',
      status: 'done',
      due_date: '2026-05-23',
      priority: 'medium',
      type: 'note',
      tags: ['Research'],
      created_at: '2026-05-15T10:00:00Z',
      updated_at: '2026-05-23T12:00:00Z'
    },
    {
      id: 'BL1NK-2003',
      title: 'Tesla cyber brochure specs',
      project_id: 'proj_brand',
      user_id: 'alex_morgan',
      description: 'Brutalist cyber vectors, heavy letter tracking, dark high-contrast red accentuation layers.',
      status: 'todo',
      due_date: '2026-06-12',
      priority: 'medium',
      type: 'task',
      tags: ['Marketing'],
      created_at: '2026-05-15T11:00:00Z',
      updated_at: '2026-05-15T11:00:00Z'
    },
    {
      id: 'BL1NK-2004',
      title: 'Airbnb luxury tier cards',
      project_id: 'proj_brand',
      user_id: 'alex_morgan',
      description: 'Soft margins, warm off-whites, heavy rounded elements, high-contrast typography, and fluid map triggers.',
      status: 'done',
      due_date: '2026-05-20',
      priority: 'medium',
      type: 'note',
      tags: ['Planning'],
      created_at: '2026-05-15T12:00:00Z',
      updated_at: '2026-05-20T14:00:00Z'
    },
    {
      id: 'BL1NK-2005',
      title: 'Nike dynamic sport vectors',
      project_id: 'proj_brand',
      user_id: 'alex_morgan',
      description: 'Heavy slanted italics, high-contrast stark photography, bold motion curves.',
      status: 'todo',
      due_date: '2026-06-18',
      priority: 'low',
      type: 'task',
      tags: ['Design'],
      created_at: '2026-05-15T13:00:00Z',
      updated_at: '2026-05-15T13:00:00Z'
    },
    {
      id: 'BL1NK-2006',
      title: 'Spotify audio waveforms design',
      project_id: 'proj_brand',
      user_id: 'alex_morgan',
      description: 'Custom HTML5 Canvas rendering audio spectrum animations, luminous green highlights on dark coal.',
      status: 'todo',
      due_date: '2026-06-25',
      priority: 'medium',
      type: 'task',
      tags: ['Dev'],
      created_at: '2026-05-15T14:00:00Z',
      updated_at: '2026-05-15T14:00:00Z'
    },
    {
      id: 'BL1NK-2007',
      title: 'Adobe workflow system tools',
      project_id: 'proj_brand',
      user_id: 'alex_morgan',
      description: 'Grid patterns, modular workspace controls, customizable panels layout rules.',
      status: 'backlog',
      due_date: '2026-06-30',
      priority: 'low',
      type: 'note',
      tags: ['Research'],
      created_at: '2026-05-15T15:00:00Z',
      updated_at: '2026-05-15T15:00:00Z'
    },
    {
      id: 'BL1NK-2008',
      title: 'Figma layout anchor layers',
      project_id: 'proj_brand',
      user_id: 'alex_morgan',
      description: 'Constraints math and rendering variables for responsive component scaling systems.',
      status: 'done',
      due_date: '2026-05-26',
      priority: 'high',
      type: 'note',
      tags: ['Planning', 'Dev'],
      created_at: '2026-05-15T16:00:00Z',
      updated_at: '2026-05-26T15:45:00Z'
    },

    // Wellness 2026 Habit Tracker (Events & Habits)
    {
      id: 'BL1NK-3001',
      title: 'Morning Yoga Session',
      project_id: 'proj_wellness',
      user_id: 'alex_morgan',
      description: 'Start the day with deep stretching, core flexibility exercises and mindful focus.',
      status: 'done',
      due_date: '2026-06-02',
      start_time: '06:30',
      end_time: '07:00',
      priority: 'high',
      type: 'habit',
      tags: ['Planning'],
      created_at: '2026-05-20T07:00:00Z',
      updated_at: '2026-06-02T07:15:00Z'
    },
    {
      id: 'BL1NK-3002',
      title: 'Evening Relaxing Run',
      project_id: 'proj_wellness',
      user_id: 'alex_morgan',
      description: 'Laps around the park to clear cognitive load followed by full body hydration.',
      status: 'todo',
      due_date: '2026-06-02',
      start_time: '18:00',
      end_time: '18:45',
      priority: 'medium',
      type: 'habit',
      tags: ['Planning'],
      created_at: '2026-05-20T08:00:00Z',
      updated_at: '2026-05-20T08:00:00Z'
    },
    {
      id: 'BL1NK-3003',
      title: 'Strategic Architecture Review',
      project_id: 'proj_wellness',
      user_id: 'alex_morgan',
      description: 'Deep work event focusing on clean service layer diagrams and database mapping paradigms.',
      status: 'todo',
      due_date: '2026-06-03',
      start_time: '14:00',
      end_time: '15:00',
      priority: 'high',
      type: 'event',
      tags: ['Planning', 'Dev'],
      created_at: '2026-05-20T10:00:00Z',
      updated_at: '2026-05-20T10:00:00Z'
    }
  ],
  folders: [
    { id: 'fold_work', name: 'Work', parent_id: null, user_id: 'alex_morgan', created_at: '2026-05-01T00:00:00Z' },
    { id: 'fold_personal', name: 'Personal', parent_id: null, user_id: 'alex_morgan', created_at: '2026-05-01T00:00:00Z' },
    { id: 'fold_archive', name: 'Archive', parent_id: null, user_id: 'alex_morgan', created_at: '2026-05-01T00:00:00Z' },
    { id: 'fold_subwork', name: 'UI & Design Systems', parent_id: 'fold_work', user_id: 'alex_morgan', created_at: '2026-05-02T00:00:00Z' }
  ],
  tags: [
    { id: 'tag_design', name: 'Design', color: '#FFD700', user_id: 'alex_morgan' },
    { id: 'tag_dev', name: 'Dev', color: '#50C878', user_id: 'alex_morgan' },
    { id: 'tag_urgent', name: 'Urgent', color: '#FF6B6B', user_id: 'alex_morgan' },
    { id: 'tag_research', name: 'Research', color: '#38bdf8', user_id: 'alex_morgan' },
    { id: 'tag_integration', name: 'Integration', color: '#c084fc', user_id: 'alex_morgan' },
    { id: 'tag_planning', name: 'Planning', color: '#fb923c', user_id: 'alex_morgan' },
    { id: 'tag_marketing', name: 'Marketing', color: '#fb7185', user_id: 'alex_morgan' },
    { id: 'tag_bug', name: 'Bug', color: '#f43f5e', user_id: 'alex_morgan' },
    { id: 'tag_feature', name: 'Feature', color: '#a7f3d0', user_id: 'alex_morgan' },
    { id: 'tag_doc', name: 'Documentation', color: '#94a3b8', user_id: 'alex_morgan' }
  ],
  tagRules: [
    { id: 'tr_restricted', type: 'restricted', rule_value: 'internal', user_id: 'alex_morgan' },
    { id: 'tr_prefix', type: 'prefix', rule_value: 'DEV-', user_id: 'alex_morgan' },
    { id: 'tr_length', type: 'length_constraint', rule_value: '15', user_id: 'alex_morgan' }
  ],
  automations: [
    {
      id: 'auto_slack',
      project_id: 'proj_cyber',
      trigger_event: 'status_changed',
      condition_field: 'status',
      condition_value: 'done',
      action_type: 'webhook',
      action_value: 'https://hooks.slack.com/services/EXAMPLE/DISPATCH',
      isActive: true,
      user_id: 'alex_morgan'
    },
    {
      id: 'auto_tag',
      project_id: 'proj_cyber',
      trigger_event: 'status_changed',
      condition_field: 'status',
      condition_value: 'done',
      action_type: 'add_tag',
      action_value: 'Urgent',
      isActive: true,
      user_id: 'alex_morgan'
    }
  ],
  webhooks: [
    {
      id: 'web_demo',
      url: 'https://api.external-notifier.demo/webhook',
      events: ['task.created', 'task.updated', 'task.completed'],
      isActive: true,
      user_id: 'alex_morgan',
      created_at: '2026-05-20T10:00:00Z'
    }
  ],
  apiKeys: [
    {
      id: 'key_1',
      key: 'bl1nk_test_api_key_12345',
      masked_key: 'bl1nk_...12345',
      name: 'Primary CLI Tool Key',
      user_id: 'alex_morgan',
      created_at: '2026-05-25T11:00:00Z'
    }
  ],
  trash: [],
  extensions: [
    {
      id: 'ext_cyber_gold',
      name: 'Cyberpunk Electric Theme',
      version: '1.0.4',
      author: 'bl1nk labs',
      type: 'theme',
      code: ':root { --accent-glow: #ffd700; --backdrop-blur: 25px; }',
      is_enabled: true,
      user_id: 'alex_morgan'
    },
    {
      id: 'ext_poll_block',
      name: 'Interactive Poll Block',
      version: '2.1.0',
      author: 'Aura Collective',
      type: 'block',
      code: 'function renderPoll(id) { return "<div class=\'p-4 bg-zinc-900 border border-yellow-500 rounded\'>Poll widget " + id + "</div>"; }',
      is_enabled: true,
      user_id: 'alex_morgan'
    }
  ],
  activityLogs: [
    { id: 'act_1', user_id: 'alex_morgan', activity: 'Updated task "Interactive keyboard shortcuts framework"', timestamp: '2026-06-02T15:00:00Z' },
    { id: 'act_2', user_id: 'alex_morgan', activity: 'System completed automation "Slack Notification" on Task BL1NK-1008', timestamp: '2026-05-30T10:15:00Z' },
    { id: 'act_3', user_id: 'alex_morgan', activity: 'Added project "Cybernetic UI Kit" to favorites', timestamp: '2026-05-28T09:12:00Z' }
  ]
};

// Singleton สำหรับเชื่อมโยงข้าม Memory และ File ใน process เดียวกัน
class DatabaseManager {
  private db: DbStructure | null = null;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf8');
        this.db = JSON.parse(raw);
        
        // ยกระดับความน่าเชื่อถือและความลื่นไหลของระบบจริง (Auto Migration จากโครงสร้างเดโม่เก่า)
        if (this.db && this.db.users) {
          const mainUser = this.db.users.find((u: any) => u.id === 'alex_morgan');
          if (mainUser) {
            if (mainUser.email === 'alex@bl1nk.demo' || mainUser.email === 'alex@bl1nk.io') {
              mainUser.email = 'alex@bl1nk.io';
              mainUser.passwordHash = crypto.createHash('sha256').update('bl1nkOS2026').digest('hex');
            }
          }
          this.saveSync();
        }
      } else {
        this.db = { ...INITIAL_DB };
        this.saveSync();
      }
    } catch (e) {
      this.db = { ...INITIAL_DB };
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
    this.db = db;
    this.saveSync();
  }
}

const dbManager = new DatabaseManager();

/**
 * JSDoc: Helper Functions สำหรับทำ CRUD และเรียกใช้งาน Business Logic
 */

export function getDb(): DbStructure {
  return dbManager.getDb();
}

export function saveDb(db: DbStructure): void {
  dbManager.save(db);
}

// ==========================================
// BUSINESS RULES: COFLICT RESOLUTION & TAG RULES
// ==========================================

/**
 * 1. ตรวจสอบ Appointment Conflict (จองเวลาซ้ำซ้อน)
 * @param userId - ID ของผู้ใช้
 * @param date - วันที่ YYYY-MM-DD
 * @param start - เวลาเริ่ม HH:MM
 * @param end - เวลาสิ้นสุด HH:MM
 * @param excludeTaskId - ID งานที่เว้น (เอาไว้ใช้ตอนอัปเดตงานตัวเอง)
 * @returns boolean - true หากชนกัน, false หากปลอดโปร่ง
 */
export function isTimeConflicting(
  userId: string,
  date: string,
  start: string,
  end: string,
  excludeTaskId?: string
): boolean {
  if (!start || !end || !date) return false;

  const db = getDb();
  // แปลงให้เป็นนาทีเพื่อความง่ายในการตรวจสอบ
  const toMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const newStartMin = toMinutes(start);
  const newEndMin = toMinutes(end);

  // ตรวจหาภารกิจในวันเดียวกันที่นัดหมุดทับกัน
  const overlappingTasks = db.tasks.filter((t) => {
    if (t.user_id !== userId) return false;
    if (t.id === excludeTaskId) return false;
    if (t.due_date !== date) return false;
    if (!t.start_time || !t.end_time) return false;
    // ข้ามงานที่เสร็จสิ้นหรือยกเลิก หากมี
    if (t.status === 'done') return false;

    const taskStartMin = toMinutes(t.start_time);
    const taskEndMin = toMinutes(t.end_time);

    // เช็กขอบเขตชนกัน
    // เงื่อนไข: startA < endB และ startB < endA
    return newStartMin < taskEndMin && taskStartMin < newEndMin;
  });

  return overlappingTasks.length > 0;
}

/**
 * 2. ตรวจสอบ Tag Rule Engine
 * @param userId - ID ของผู้ใช้
 * @param tags - รายการชื่อแท็กที่จะบันทึก
 * @returns { error?: string; processedTags: string[] }
 */
export function validateAndProcessTags(userId: string, tags: string[]): { error?: string; processedTags: string[] } {
  const db = getDb();
  const rules = db.tagRules.filter((r) => r.user_id === userId);

  let processedTags = [...tags];

  for (const rule of rules) {
    // 1. Restricted tags Check
    if (rule.type === 'restricted') {
      const restrictedTagName = rule.rule_value;
      if (processedTags.some((t) => t.toLowerCase() === restrictedTagName.toLowerCase())) {
        return {
          error: `แท็ก "${restrictedTagName}" เป็นแท็กที่ถูกห้ามใช้ (Restricted Tag)`,
          processedTags,
        };
      }
    }

    // 2. Length Constraints Check
    if (rule.type === 'length_constraint') {
      const maxLen = parseInt(rule.rule_value, 10);
      if (!isNaN(maxLen)) {
        for (const t of processedTags) {
          if (t.length > maxLen) {
            return {
              error: `ชื่อแท็ก "${t}" ขนาดยาวเกินข้อจำกัดสูงสุด ${maxLen} ตัวอักษร`,
              processedTags,
            };
          }
        }
      }
    }

    // 3. Prefix Rule (ตัวอย่าง: เติม DEV- ให้อัตโนมัติในงานบางประเภท)
    if (rule.type === 'prefix') {
      const prefix = rule.rule_value;
      processedTags = processedTags.map((t) => {
        // หากผู้ใช้พิมพ์แท็กธรรมดา เช่น 'dev' ให้สืบหาแล้วเติม Prefix เช่น DEV-dev
        if (!t.startsWith(prefix) && t.toLowerCase().includes('dev')) {
          return prefix + t;
        }
        return t;
      });
    }
  }

  // ป้องกันสีขาด/แท็กซ้ำ
  processedTags = Array.from(new Set(processedTags));

  return { processedTags };
}

/**
 * 3. ระบบ Automations Trigger & Webhooks trigger
 * @param userId - ID ผู้ใช้
 * @param event - 'task.created' | 'task.updated' | 'task.completed' | 'note.updated' | 'task.deleted'
 * @param data - รายละเอียด Object งาน
 */
export function triggerSystemEvents(userId: string, event: string, data: any): void {
  const db = getDb();

  // 1. ตราสถิติและ Activity logs
  const logId = 'log_' + Math.random().toString(36).substr(2, 9);
  let actionDesc = `User triggered event: ${event}`;
  if (event === 'task.created') actionDesc = `Created task "${data.title}"`;
  if (event === 'task.updated') actionDesc = `Updated task "${data.title}"`;
  if (event === 'task.completed') actionDesc = `Completed task "${data.title}" (Status to DONE)`;
  if (event === 'task.deleted') actionDesc = `Deleted task "${data.title}"`;

  db.activityLogs.unshift({
    id: logId,
    user_id: userId,
    activity: actionDesc,
    timestamp: new Date().toISOString(),
  });

  // ลิมิต logs ล่าสุด 100 รายการ
  if (db.activityLogs.length > 200) {
    db.activityLogs = db.activityLogs.slice(0, 100);
  }

  // 2. Automations Engine (Trigger -> Actions)
  if (event === 'task.updated' || event === 'task.completed') {
    const taskObj = data as Task;
    const projectAutomations = db.automations.filter(
      (a) => a.project_id === taskObj.project_id && a.isActive && a.user_id === userId
    );

    for (const auto of projectAutomations) {
      let isTriggered = false;

      // Status changed
      if (auto.trigger_event === 'status_changed') {
        if (auto.condition_field === 'status' && taskObj.status === auto.condition_value) {
          isTriggered = true;
        }
      }

      if (isTriggered) {
        // Dispatch actions
        if (auto.action_type === 'add_tag') {
          const targetTask = db.tasks.find((t) => t.id === taskObj.id);
          if (targetTask && !targetTask.tags.includes(auto.action_value)) {
            targetTask.tags.push(auto.action_value);
            targetTask.updated_at = new Date().toISOString();
          }
        }
        // ในระบบสาธิต สำหรับ mock Webhooks/Slack notification บันทึกลง Activity log เพิ่มเติม
        const autoLogId = 'log_auto_' + Math.random().toString(36).substr(2, 9);
        db.activityLogs.unshift({
          id: autoLogId,
          user_id: userId,
          activity: `System completed automation "${auto.action_type === 'webhook' ? 'Slack Notification' : 'Add Tag Urgent'}" on Task ${taskObj.id}`,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  // 3. Webhooks dispatch
  const activeWebhooks = db.webhooks.filter((w) => w.isActive && w.user_id === userId && w.events.includes(event));
  activeWebhooks.forEach((wh) => {
    // ในสภาวะ Cloud Run และ Preview ของ AI Studio, Webhook จะกระจายผ่าน Fetch async ลอยๆ (fire and forget)
    // เพื่อป้องกันการ blocking หรือ delay ในการตอบสนอง REST API
    fetch(wh.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Aura-Signature': 'sha256_mock_signature_for_preview_system',
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data,
      }),
    }).catch((_) => {
      // ซับ error หรือ webhook ยิงไม่สำเร็จอย่างสง่างาม
    });
  });

  saveDb(db);
}
