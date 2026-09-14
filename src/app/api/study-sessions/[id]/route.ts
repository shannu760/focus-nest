import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { studySessions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db
    .delete(studySessions)
    .where(and(eq(studySessions.id, id), eq(studySessions.userId, user.id)));

  return NextResponse.json({ ok: true });
}
