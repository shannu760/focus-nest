import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, ensureDbReady } from "@/db";
import { relaxActivities } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureDbReady();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db
    .delete(relaxActivities)
    .where(and(eq(relaxActivities.id, id), eq(relaxActivities.userId, user.id)));

  return NextResponse.json({ ok: true });
}
