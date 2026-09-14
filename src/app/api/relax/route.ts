import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, ensureDbReady } from "@/db";
import { relaxActivities } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  await ensureDbReady();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(relaxActivities)
    .where(eq(relaxActivities.userId, user.id))
    .orderBy(desc(relaxActivities.completedAt))
    .limit(100);

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  await ensureDbReady();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const activityType = String(body?.activityType ?? "breathing");
  const title = String(body?.title ?? "").trim();
  const durationMin = Math.min(120, Math.max(1, Number(body?.durationMin) || 5));
  const moodBefore = Math.min(5, Math.max(1, Number(body?.moodBefore) || 3));
  const moodAfter = Math.min(5, Math.max(1, Number(body?.moodAfter) || 4));

  if (!title) {
    return NextResponse.json({ error: "Activity title is required." }, { status: 400 });
  }

  const [row] = await db
    .insert(relaxActivities)
    .values({ userId: user.id, activityType, title, durationMin, moodBefore, moodAfter })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
