import { NextRequest, NextResponse } from 'next/server';

/**
 * JSDoc: บริการ REST API Specification เอกสารคู่มือนักพัฒนา (GET /api/docs)
 */
export async function GET(req: NextRequest) {
  const spec = {
    info: {
      title: 'bl1nk ink REST API Engine',
      version: '1.2.0-secure',
      description: 'The personal system core API endpoints. All requests must provide Bearer API Token inside your authorization headers.',
      security: {
        header: 'Authorization',
        type: 'Bearer <key>',
        example: 'Bearer bl1nk_sec_examplexxxx'
      },
      rate_limit: '100 requests / minute per client key'
    },
    endpoints: [
      {
        path: '/api/projects',
        methods: {
          GET: {
            summary: 'List user projects',
            parameters: [
              { name: 'favorite', type: 'boolean', description: 'Filter only favorite spaces' }
            ],
            response: 'Array of projects'
          },
          POST: {
            summary: 'Create a new project workspace',
            body: { name: 'string', description: 'string (optional)' },
            response: 'Created project object'
          }
        }
      },
      {
        path: '/api/tasks',
        methods: {
          GET: {
            summary: 'Search and filter tasks',
            parameters: [
              { name: 'project_id', type: 'string' },
              { name: 'status', type: 'string', enum: ['backlog', 'todo', 'in_progress', 'review', 'done'] },
              { name: 'tag', type: 'string' },
              { name: 'q', type: 'string', description: 'Fuzzy keyword search' },
              { name: 'sort', type: 'string', example: 'due_date, -created_at' }
            ],
            response: 'Paginated list of tasks'
          },
          POST: {
            summary: 'Create a task or scheduled calendar event',
            description: 'Validates tag rules and checks calendar conflicts prior to saving.',
            body: {
              title: 'string (required)',
              project_id: 'string (required)',
              type: 'string (task | milestone | note | event | habit)',
              due_date: 'YYYY-MM-DD',
              start_time: 'HH:MM (optional, conflict checked)',
              end_time: 'HH:MM (optional, conflict checked)',
              tags: 'string[] (subject to length, restricted tag policy)'
            },
            responses: {
              201: 'Task Created Successfully',
              409: 'Appointment Time Conflict Collided',
              422: 'Tag constraint rules violated'
            }
          }
        }
      },
      {
        path: '/api/trash',
        methods: {
          GET: { summary: 'List deleted items' },
          POST: {
            summary: 'Perform restoration or wipe item',
            body: { action: 'restore | delete_permanently | empty_trash', id: 'string' }
          }
        }
      },
      {
        path: '/api/webhooks',
        methods: {
          POST: {
            summary: 'Register webhook postback pipeline',
            body: { url: 'string', events: ['task.created', 'task.updated', 'task.completed'] }
          }
        }
      }
    ]
  };

  return NextResponse.json(spec);
}
