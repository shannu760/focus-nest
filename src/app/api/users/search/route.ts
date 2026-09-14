import { NextResponse } from "next/server";
import { and, eq, ilike, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 1) return NextResponse.json([]);

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      classGrade: users.classGrade,
      examTarget: users.examTarget,
    })
    .from(users)
    .where(
      and(
        ne(users.id, user.id),
        or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`))
      )
    )
    .limit(8);

  // also match by class grade word (e.g. "Class 11")
  const classMatches = q.toLowerCase().includes("class")
    ? await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          classGrade: users.classGrade,
          examTarget: users.examTarget,
        })
        .from(users)
        .where(and(ne(users.id, user.id), eq(users.classGrade, q)))
        .limit(8)
    : [];

  const seen = new Set(rows.map((r) => r.id));
  for (const c of classMatches) {
    if (!seen.has(c.id)) {
      rows.push(c);
      seen.add(c.id);
    }
  }

  return NextResponse.json(rows.slice(0, 8));
}
