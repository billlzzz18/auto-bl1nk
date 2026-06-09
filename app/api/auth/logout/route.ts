import { NextRequest, NextResponse } from 'next/server';
import { clearSessionUser } from '@/lib/auth';

/**
 * JSDoc: ล้างเซสชันและออกระบบ (User Logout Endpoint)
 */
export async function POST(req: NextRequest) {
  try {
    await clearSessionUser();
    return NextResponse.json({ message: 'ออกจากระบบสำเร็จ' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'ไม่สามารถออกจากระบบได้' }, { status: 500 });
  }
}
