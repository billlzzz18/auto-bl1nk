import { NextRequest, NextResponse } from "next/server";
import { eq, ilike } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { hashPassword, setSessionUser } from "@/lib/auth";
import { account, user } from "@/lib/db/schema";
import { errorResponse, validateInput } from "@/lib/api-helpers";
import { authLoginSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validateInput(authLoginSchema, body);

    if (validation.error) {
      return errorResponse(validation.error, 400);
    }

    const { email, password } = validation.data!;
    const db = getDb();
    const [existingUser] = await db
      .select()
      .from(user)
      .where(ilike(user.email, email))
      .limit(1);

    if (!existingUser) {
      return errorResponse("ไม่พบบัญชีผู้ใช้ในระบบ หรืออีเมลไม่ถูกต้อง", 400);
    }

    const [credential] = await db
      .select()
      .from(account)
      .where(eq(account.userId, existingUser.id))
      .limit(1);

    const inputHash = hashPassword(password);
    if (credential?.password !== inputHash) {
      return errorResponse("รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง", 400);
    }

    await setSessionUser(existingUser.id);

    return NextResponse.json({
      message: "เข้าสู่ระบบสำเร็จ",
      user: {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        avatar: existingUser.image,
        bio: "",
      },
    });
  } catch (e: any) {
    return errorResponse(e.message || "เกิดข้อผิดพลาดภายในระบบ", 500);
  }
}
