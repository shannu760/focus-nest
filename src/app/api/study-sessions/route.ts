import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { studySessions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(studySessions)
    .where(eq(studySessions.userId, user.id))
    .orderBy(desc(studySessions.completedAt))
    .limit(100);

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const subject = String(body?.subject ?? "").trim();
  const topic = String(body?.topic ?? "").trim();
  const durationMin = Math.min(600, Math.max(1, Number(body?.durationMin) || 25));
  const focusScore = body?.focusScore ? Math.min(5, Math.max(1, Number(body.focusScore))) : null;
  const notes = body?.notes ? String(body.notes).slice(0, 500) : null;

  if (!subject || !topic) {
    return NextResponse.json(
      { error: "Subject and topic are required." },
      { status: 400 }
    );
  }

  const [row] = await db
    .insert(studySessions)
    .values({
      userId: user.id,
      subject,
      topic,
      durationMin,
      focusScore,
      notes,
      completedAt: body?.completedAt ? new Date(body.completedAt) : new Date(),
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
