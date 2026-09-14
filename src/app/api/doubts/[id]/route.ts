import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { doubts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const action = body?.action;

  const [doubt] = await db.select().from(doubts).where(eq(doubts.id, id)).limit(1);
  if (!doubt) return NextResponse.json({ error: "Doubt not found." }, { status: 404 });

  if (action === "upvote") {
    const has = doubt.upvoterIds.includes(user.id);
    const upvoterIds = has
      ? doubt.upvoterIds.filter((u) => u !== user.id)
      : [...doubt.upvoterIds, user.id];
    const [updated] = await db
      .update(doubts)
      .set({ upvoterIds })
      .where(eq(doubts.id, id))
      .returning();
    return NextResponse.json({
      upvoteCount: updated.upvoterIds.length,
      myUpvote: updated.upvoterIds.includes(user.id),
    });
  }

  if (action === "resolve") {
    if (doubt.authorId !== user.id) {
      return NextResponse.json({ error: "Only the author can mark it resolved." }, { status: 403 });
    }
    const [updated] = await db
      .update(doubts)
      .set({ resolved: !doubt.resolved })
      .where(eq(doubts.id, id))
      .returning();
    return NextResponse.json({ resolved: updated.resolved });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db
    .delete(doubts)
    .where(and(eq(doubts.id, id), eq(doubts.authorId, user.id)));

  return NextResponse.json({ ok: true });
}
