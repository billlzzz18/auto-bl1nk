import { NextRequest, NextResponse } from "next/server";
import { eq, ilike } from "drizzle-orm";
import { getDb as getDrizzleDb } from "@/lib/db/client";
import { getDb as getMemoryDb, findUserByEmail } from "@/lib/db";
import { hashPassword, setSessionUser } from "@/lib/auth";
import { account, user } from "@/lib/db/schema";
import { isDatabaseConfigured } from "@/lib/db/config";
import { errorResponse } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกอีเมลและรหัสผ่าน" },
        { status: 400 },
      );
    }

    if (isDatabaseConfigured()) {
      const db = getDrizzleDb();
      const [existingUser] = await db
        .select()
        .from(user)
        .where(ilike(user.email, email))
        .limit(1);

      if (!existingUser) {
        return NextResponse.json(
          { error: "ไม่พบบัญชีผู้ใช้ในระบบ หรืออีเมลไม่ถูกต้อง" },
          { status: 400 },
        );
      }

      const [credential] = await db
        .select()
        .from(account)
        .where(eq(account.userId, existingUser.id))
        .limit(1);
      const inputHash = hashPassword(password);
      if (credential?.password !== inputHash) {
        return NextResponse.json(
          { error: "รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง" },
          { status: 400 },
        );
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
    }

    const memoryUser = findUserByEmail(email);
    if (!memoryUser) {
      return NextResponse.json(
        { error: "ไม่พบบัญชีผู้ใช้ในระบบ หรืออีเมลไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const memoryDb = getMemoryDb();
    const inputHash = hashPassword(password);
    const accountRecord = memoryDb.accounts.find(
      (a) => a.user_id === memoryUser.id && a.provider_id === "credential",
    );
    if (!accountRecord || accountRecord.password !== inputHash) {
      return NextResponse.json(
        { error: "รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง" },
        { status: 400 },
      );
    }

    await setSessionUser(memoryUser.id);

    return NextResponse.json({
      message: "เข้าสู่ระบบสำเร็จ",
      user: {
        id: memoryUser.id,
        email: memoryUser.email,
        name: memoryUser.name,
        avatar: memoryUser.avatar,
        bio: memoryUser.bio || "",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 },
    );
  }
}
