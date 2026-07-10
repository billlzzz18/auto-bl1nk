import { cookies, headers } from 'next/headers';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { user, apiKey } from '@/lib/db/schema';
import type { User } from '@/lib/db/schema';

const SESSION_COOKIE_NAME = 'bl1nk_session';

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
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

    const db = getDb();
    const [existingUser] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    return existingUser || null;
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
  const db = getDb();

  const [apiKeyRecord] = await db.select().from(apiKey).where(eq(apiKey.key, key)).limit(1);
  if (!apiKeyRecord) {
    return null;
  }

  const [userRecord] = await db.select().from(user).where(eq(user.id, apiKeyRecord.userId)).limit(1);
  return userRecord || null;
}
