import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { stressCheckins } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(stressCheckins)
    .where(eq(stressCheckins.userId, user.id))
    .orderBy(desc(stressCheckins.createdAt))
    .limit(100);

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const stressLevel = Math.min(10, Math.max(1, Number(body?.stressLevel) || 5));
  const mood = String(body?.mood ?? "okay");
  const triggers = Array.isArray(body?.triggers)
    ? body.triggers.map((t: unknown) => String(t).slice(0, 40)).slice(0, 6)
    : [];
  const note = body?.note ? String(body.note).slice(0, 500) : null;

  const [row] = await db
    .insert(stressCheckins)
    .values({ userId: user.id, stressLevel, mood, triggers, note })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
