import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { hashPassword, setSessionUser } from "@/lib/auth";
import { account, project, tag, task, user } from "@/lib/db/schema";
import { errorResponse } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return errorResponse("กรุณากรอกข้อมูลให้ครบถ้วน", 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse("รูปแบบอีเมลไม่ถูกต้อง", 400);
    }

    if (password.length < 6) {
      return errorResponse("รหัสผ่านต้องยาวไม่น้อยกว่า 6 ตัวอักษร", 400);
    }

    const db = getDb();
    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, email.toLowerCase()))
      .limit(1);

    if (existingUser) {
      return errorResponse("อีเมลนี้ถูกใช้งานไปแล้วในระบบ", 400);
    }

    const userId = `usr_${randomUUID()}`;
    const passwordHash = hashPassword(password);

    await db.insert(user).values({
      id: userId,
      email: email.toLowerCase(),
      name,
      image: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
      emailVerified: false,
    });

    await db.insert(account).values({
      id: `acct_${randomUUID()}`,
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash,
    });

    const seedProjectId = `proj_${randomUUID()}`;
    await db.insert(project).values({
      id: seedProjectId,
      name: "My First Space",
      description:
        "ยินดีต้อนรับเข้าสู่อาณาจักรส่วนตัวของคุณ! นี่คือโปรเจกต์แรกที่คุณควบคุมได้ 100%",
      userId,
      isFavorite: true,
      sharingSettings: { public_access: false, include_subpages: false },
      customProperties: [],
    });

    await db.insert(task).values({
      id: "BL1NK-201",
      title: "เริ่มต้นสำรวจ bl1nk ink 🚀",
      projectId: seedProjectId,
      userId,
      description:
        "ยินดีต้อนรับ! ลองเปลี่ยนมุมมองสลับสว่าง-มืด หรือกดเปลี่ยนหน้าจอไปมาระหว่าง Kanban, Grid, Table และ Calendar นะครับ",
      status: "todo",
      dueDate: new Date().toISOString().split("T")[0],
      priority: "high",
      type: "task",
      tags: ["FirstStep", "Welcome"],
    });

    await db.insert(tag).values({
      id: `tag_welcome_${randomUUID()}`,
      name: "Welcome",
      color: "#FFD700",
      userId,
    });

    await setSessionUser(userId);

    return NextResponse.json({
      message: "สมัครใช้งานเรียบร้อยแล้ว",
      user: {
        id: userId,
        email: email.toLowerCase(),
        name,
        avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
      },
    });
  } catch (e: any) {
    return errorResponse(e.message || "เกิดข้อผิดพลาดภายในระบบ", 500);
  }
}
