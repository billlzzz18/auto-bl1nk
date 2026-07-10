import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb as getDrizzleDb } from "@/lib/db/client";
import { getDb as getMemoryDb, createUser } from "@/lib/db";
import { hashPassword, setSessionUser } from "@/lib/auth";
import { account, project, tag, task, user } from "@/lib/db/schema";
import { isDatabaseConfigured } from "@/lib/db/config";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "รูปแบบอีเมลไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "รหัสผ่านต้องยาวไม่น้อยกว่า 6 ตัวอักษร" },
        { status: 400 },
      );
    }

    if (isDatabaseConfigured()) {
      const db = getDrizzleDb();
      const [existingUser] = await db
        .select()
        .from(user)
        .where(eq(user.email, email.toLowerCase()))
        .limit(1);

      if (existingUser) {
        return NextResponse.json(
          { error: "อีเมลนี้ถูกใช้งานไปแล้วในระบบ" },
          { status: 400 },
        );
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
    }

    const memoryDb = getMemoryDb();
    const existingMemoryUser = memoryDb.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
    if (existingMemoryUser) {
      return NextResponse.json(
        { error: "อีเมลนี้ถูกใช้งานไปแล้วในระบบ" },
        { status: 400 },
      );
    }

    const userId = `usr_${randomUUID()}`;
    const passwordHash = hashPassword(password);

    const newUser = createUser({
      id: userId,
      email: email.toLowerCase(),
      name,
      passwordHash,
    });

    memoryDb.users.push(newUser);
    memoryDb.accounts.push({
      id: `acct_${randomUUID()}`,
      user_id: userId,
      provider_id: "credential",
      account_id: userId,
      password: passwordHash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const seedProjectId = `proj_${randomUUID()}`;
    memoryDb.projects.push({
      id: seedProjectId,
      name: "My First Space",
      description:
        "ยินดีต้อนรับเข้าสู่อาณาจักรส่วนตัวของคุณ! นี่คือโปรเจกต์แรกที่คุณควบคุมได้ 100%",
      user_id: userId,
      is_favorite: true,
      sharing_settings: { public_access: false, include_subpages: false },
      custom_properties: [],
      created_at: new Date().toISOString(),
    });

    memoryDb.tasks.push({
      id: "BL1NK-201",
      title: "เริ่มต้นสำรวจ bl1nk ink 🚀",
      project_id: seedProjectId,
      user_id: userId,
      description:
        "ยินดีต้อนรับ! ลองเปลี่ยนมุมมองสลับสว่าง-มืด หรือกดเปลี่ยนหน้าจอไปมาระหว่าง Kanban, Grid, Table และ Calendar นะครับ",
      status: "todo",
      due_date: new Date().toISOString().split("T")[0],
      priority: "high",
      type: "task",
      tags: ["FirstStep", "Welcome"],
      comments: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    memoryDb.tags.push({
      id: `tag_welcome_${randomUUID()}`,
      name: "Welcome",
      color: "#FFD700",
      user_id: userId,
    });

    await setSessionUser(userId);

    return NextResponse.json({
      message: "สมัครใช้งานเรียบร้อยแล้ว",
      user: {
        id: userId,
        email: email.toLowerCase(),
        name,
        avatar: newUser.avatar,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 },
    );
  }
}
