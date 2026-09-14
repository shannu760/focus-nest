import { NextResponse } from "next/server";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { peers, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(peers)
    .where(or(eq(peers.requesterId, user.id), eq(peers.addresseeId, user.id)))
    .orderBy(desc(peers.updatedAt));

  const otherIds = rows.map((r) => (r.requesterId === user.id ? r.addresseeId : r.requesterId));
  const people = otherIds.length
    ? await db.select().from(users).where(inArray(users.id, otherIds))
    : [];
  const byId = new Map(people.map((p) => [p.id, p]));

  const result = rows
    .map((r) => {
      const otherId = r.requesterId === user.id ? r.addresseeId : r.requesterId;
      const other = byId.get(otherId);
      if (!other) return null;
      return {
        id: r.id,
        status: r.status,
        direction: r.requesterId === user.id ? "outgoing" : "incoming",
        createdAt: r.createdAt,
        user: {
          id: other.id,
          name: other.name,
          email: other.email,
          classGrade: other.classGrade,
          examTarget: other.examTarget,
        },
      };
    })
    .filter(Boolean);

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const addresseeId = String(body?.addresseeId ?? "");

  if (!addresseeId) {
    return NextResponse.json({ error: "Missing peer id." }, { status: 400 });
  }
  if (addresseeId === user.id) {
    return NextResponse.json({ error: "You can't add yourself 😄" }, { status: 400 });
  }

  const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, addresseeId));
  if (!target) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  // check for existing relation either direction
  const [existing] = await db
    .select()
    .from(peers)
    .where(
      or(
        and(eq(peers.requesterId, user.id), eq(peers.addresseeId, addresseeId)),
        and(eq(peers.requesterId, addresseeId), eq(peers.addresseeId, user.id))
      )
    )
    .limit(1);

  if (existing) {
    if (existing.status === "accepted") {
      return NextResponse.json({ error: "Already peers." }, { status: 409 });
    }
    if (existing.requesterId === user.id) {
      return NextResponse.json({ error: "Request already sent." }, { status: 409 });
    }
    // incoming pending request exists — auto-accept it
    const [updated] = await db
      .update(peers)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(peers.id, existing.id))
      .returning();
    return NextResponse.json({ status: "accepted", relation: updated }, { status: 201 });
  }

  const [row] = await db
    .insert(peers)
    .values({ requesterId: user.id, addresseeId })
    .returning();

  return NextResponse.json({ status: "pending", relation: row }, { status: 201 });
}
