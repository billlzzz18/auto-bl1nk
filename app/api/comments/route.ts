import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, TaskComment } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('task_id');

    if (!taskId) {
      return NextResponse.json({ error: 'Missing task_id' }, { status: 400 });
    }

    const db = getDb();
    const task = db.tasks.find((t) => t.id === taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task.user_id !== user.id) {
      return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
    }

    const comments = task.comments || [];
    return NextResponse.json({ data: comments });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { task_id, text, author_name } = body;

    if (!task_id || !text) {
      return NextResponse.json({ error: 'Missing task_id or text' }, { status: 400 });
    }

    const db = getDb();
    const taskIndex = db.tasks.findIndex((t) => t.id === task_id);
    if (taskIndex === -1) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = db.tasks[taskIndex];
    if (task.user_id !== user.id) {
      return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
    }

    if (!task.comments) {
      task.comments = [];
    }

    const newComment: TaskComment = {
      id: 'cmt_' + Math.random().toString(36).substr(2, 9),
      task_id,
      author_name: author_name || user.name || 'Anonymous',
      text,
      created_at: new Date().toISOString(),
    };

    task.comments.push(newComment);
    db.tasks[taskIndex] = task;
    saveDb(db);

    return NextResponse.json({ message: 'Comment added successfully', data: newComment });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal Error' }, { status: 500 });
  }
}
