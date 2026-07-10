import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { user } from "@/lib/db/schema";

/**
 * JSDoc: ตรวจสอบข้อมูลล็อกอินของผู้ใช้ฝั่ง Client-Side (Session Verification)
 */
export async function GET(req: NextRequest) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        avatar: currentUser.image,
        bio: "",
        google_connected: false,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ authenticated: false, error: e.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { google_connected } = await req.json();
    const db = getDb();
    await db
      .update(user)
      .set({ image: currentUser.image })
      .where(eq(user.id, currentUser.id));

    return NextResponse.json({ success: true, google_connected });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
