import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { doubtAnswers, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const rows = await db
    .select({
      answer: doubtAnswers,
      authorName: users.name,
    })
    .from(doubtAnswers)
    .innerJoin(users, eq(users.id, doubtAnswers.authorId))
    .where(eq(doubtAnswers.doubtId, id))
    .orderBy(asc(doubtAnswers.createdAt));

  return NextResponse.json(
    rows.map(({ answer, authorName }) => ({
      ...answer,
      authorName,
      upvoteCount: answer.upvoterIds.length,
      myUpvote: answer.upvoterIds.includes(user.id),
    }))
  );
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const text = String(body?.body ?? "").trim();

  if (text.length < 5) {
    return NextResponse.json({ error: "Answer is too short." }, { status: 400 });
  }

  const [row] = await db
    .insert(doubtAnswers)
    .values({ doubtId: id, authorId: user.id, body: text })
    .returning();

  return NextResponse.json(
    { ...row, authorName: user.name, upvoteCount: 0, myUpvote: false },
    { status: 201 }
  );
}
