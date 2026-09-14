import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, ensureDbReady } from "@/db";
import { users } from "@/db/schema";
import { createSession, hashPassword, setSessionCookie, verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const classGrade = String(body?.classGrade ?? "Class 11");
  const examTarget = String(body?.examTarget ?? "JEE Main");

  if (name.length < 2) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  try {
    await ensureDbReady();
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      if (body?.resetPassword) {
        const newHash = await hashPassword(password);
        await db
          .update(users)
          .set({
            passwordHash: newHash,
            name: name.length >= 2 ? name : existing.name,
            classGrade: classGrade || existing.classGrade,
            examTarget: examTarget || existing.examTarget,
          })
          .where(eq(users.id, existing.id));
        const token = await createSession(existing.id);
        await setSessionCookie(token);
        return NextResponse.json({ ok: true, reset: true }, { status: 200 });
      }

      const valid = await verifyPassword(password, existing.passwordHash);
      if (valid) {
        const token = await createSession(existing.id);
        await setSessionCookie(token);
        return NextResponse.json({ ok: true, existingUser: true }, { status: 200 });
      }
      return NextResponse.json(
        { error: "An account with this email already exists. Click below to log in or update your password.", canReset: true },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(users)
      .values({ name, email, passwordHash, classGrade, examTarget })
      .returning();

    const token = await createSession(user.id);
    await setSessionCookie(token);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err: any) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: err?.message || "Something went wrong while creating your account. Please try again." },
      { status: 500 }
    );
  }
}
