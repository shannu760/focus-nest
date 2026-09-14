import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { doubtAnswers, doubts } from "@/db/schema";
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

  const [answer] = await db.select().from(doubtAnswers).where(eq(doubtAnswers.id, id)).limit(1);
  if (!answer) return NextResponse.json({ error: "Answer not found." }, { status: 404 });

  if (action === "upvote") {
    const has = answer.upvoterIds.includes(user.id);
    const upvoterIds = has
      ? answer.upvoterIds.filter((u) => u !== user.id)
      : [...answer.upvoterIds, user.id];
    const [updated] = await db
      .update(doubtAnswers)
      .set({ upvoterIds })
      .where(eq(doubtAnswers.id, id))
      .returning();
    return NextResponse.json({
      upvoteCount: updated.upvoterIds.length,
      myUpvote: updated.upvoterIds.includes(user.id),
    });
  }

  if (action === "accept") {
    const [doubt] = await db.select().from(doubts).where(eq(doubts.id, answer.doubtId)).limit(1);
    if (!doubt || doubt.authorId !== user.id) {
      return NextResponse.json(
        { error: "Only the person who asked can accept an answer." },
        { status: 403 }
      );
    }
    await db
      .update(doubtAnswers)
      .set({ accepted: false })
      .where(eq(doubtAnswers.doubtId, doubt.id));
    const [updated] = await db
      .update(doubtAnswers)
      .set({ accepted: true })
      .where(eq(doubtAnswers.id, id))
      .returning();
    await db.update(doubts).set({ resolved: true }).where(eq(doubts.id, doubt.id));
    return NextResponse.json({ accepted: updated.accepted });
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
    .delete(doubtAnswers)
    .where(and(eq(doubtAnswers.id, id), eq(doubtAnswers.authorId, user.id)));

  return NextResponse.json({ ok: true });
}
