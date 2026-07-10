import { cookies, headers } from 'next/headers';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { getDb as getDrizzleDb } from '@/lib/db/client';
import { getDb as getMemoryDb, findUserByEmail, findUserById } from '@/lib/db';
import { user, apiKey } from '@/lib/db/schema';
import type { User } from '@/lib/db/schema';

const SESSION_COOKIE_NAME = 'bl1nk_session';

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

async function getDbForAuth() {
  if (isDatabaseConfigured()) {
    return { db: getDrizzleDb(), mode: 'drizzle' as const };
  }
  return { db: getMemoryDb(), mode: 'memory' as const };
}

export async function getSessionUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    let userId = sessionCookie?.value;

    if (!userId) {
      const headerStore = await headers();
      const authHeader = headerStore.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        userId = authHeader.substring(7);
      }
      if (!userId) {
        userId = headerStore.get('x-session-user-id') || undefined;
      }
    }

    if (!userId) {
      return null;
    }

    const { db, mode } = await getDbForAuth();

    if (mode === 'drizzle') {
      const [existingUser] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
      return existingUser || null;
    }

    const memoryUser = findUserById(userId);
    if (!memoryUser) {
      return null;
    }

    return {
      id: memoryUser.id,
      email: memoryUser.email,
      name: memoryUser.name,
      image: memoryUser.avatar,
      emailVerified: false,
      createdAt: new Date(memoryUser.created_at),
      updatedAt: memoryUser.updated_at ? new Date(memoryUser.updated_at) : new Date(memoryUser.created_at),
    } as User;
  } catch (e) {
    return null;
  }
}

export async function setSessionUser(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: userId,
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function clearSessionUser(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function authenticateApiKey(authHeader: string | null): Promise<User | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const key = authHeader.substring(7);
  const { db, mode } = await getDbForAuth();

  if (mode === 'drizzle') {
    const [apiKeyRecord] = await db.select().from(apiKey).where(eq(apiKey.key, key)).limit(1);
    if (!apiKeyRecord) {
      return null;
    }

    const [userRecord] = await db.select().from(user).where(eq(user.id, apiKeyRecord.userId)).limit(1);
    return userRecord || null;
  }

  const memoryDb = db as ReturnType<typeof getMemoryDb>;
  const apiKeyRecord = memoryDb.apiKeys.find((k) => k.key === key);
  if (!apiKeyRecord) {
    return null;
  }

  const memoryUser = memoryDb.users.find((u) => u.id === apiKeyRecord.user_id);
  if (!memoryUser) {
    return null;
  }

  return {
    id: memoryUser.id,
    email: memoryUser.email,
    name: memoryUser.name,
    image: memoryUser.avatar,
    emailVerified: false,
    createdAt: new Date(memoryUser.created_at),
    updatedAt: memoryUser.updated_at ? new Date(memoryUser.updated_at) : new Date(memoryUser.created_at),
  } as User;
}
