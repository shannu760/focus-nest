import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { doubtAnswers, doubts, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select({
      doubt: doubts,
      authorName: users.name,
      answerCount: sql<number>`count(${doubtAnswers.id})::int`,
    })
    .from(doubts)
    .innerJoin(users, eq(users.id, doubts.authorId))
    .leftJoin(doubtAnswers, eq(doubtAnswers.doubtId, doubts.id))
    .groupBy(doubts.id, users.name)
    .orderBy(desc(doubts.createdAt))
    .limit(100);

  const result = rows.map(({ doubt, authorName, answerCount }) => ({
    ...doubt,
    authorName,
    answerCount,
    myUpvote: doubt.upvoterIds.includes(user.id),
    upvoteCount: doubt.upvoterIds.length,
  }));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const title = String(body?.title ?? "").trim();
  const detail = String(body?.body ?? "").trim();
  const subject = String(body?.subject ?? "Physics");
  const classGrade = String(body?.classGrade ?? user.classGrade);

  if (title.length < 5) {
    return NextResponse.json({ error: "Title must be at least 5 characters." }, { status: 400 });
  }
  if (detail.length < 10) {
    return NextResponse.json(
      { error: "Add a bit more detail (10+ characters)." },
      { status: 400 }
    );
  }

  const [row] = await db
    .insert(doubts)
    .values({ authorId: user.id, title, body: detail, subject, classGrade })
    .returning();

  return NextResponse.json(
    { ...row, authorName: user.name, answerCount: 0, myUpvote: false, upvoteCount: 0 },
    { status: 201 }
  );
}
