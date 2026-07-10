import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { getSessionUser } from '@/lib/auth';
import { folder, project } from '@/lib/db/schema';
import { errorResponse } from '@/lib/api-helpers';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await params;
    const db = getDb();

    const [targetFolder] = await db
      .select()
      .from(folder)
      .where(and(eq(folder.id, id), eq(folder.userId, user.id)))
      .limit(1);

    if (!targetFolder) {
      return errorResponse('ไม่พบโฟลเดอร์ระบุ หรือคุณไม่มีสิทธิ์ในการจัดการข้อมูลนี้', 404);
    }

    await db.delete(folder).where(eq(folder.id, id));

    await db
      .update(project)
      .set({ folderId: null })
      .where(eq(project.folderId, id));

    await db
      .update(folder)
      .set({ parentId: null })
      .where(eq(folder.parentId, id));

    return NextResponse.json({ message: 'ลบโฟลเดอร์เรียบร้อยแล้ว' });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
