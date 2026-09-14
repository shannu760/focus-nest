import { NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { peers } from "@/db/schema";
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

  const [relation] = await db.select().from(peers).where(eq(peers.id, id)).limit(1);
  if (!relation) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }
  if (relation.addresseeId !== user.id) {
    return NextResponse.json({ error: "Only the recipient can respond." }, { status: 403 });
  }

  if (action === "accept") {
    const [updated] = await db
      .update(peers)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(peers.id, id))
      .returning();
    return NextResponse.json(updated);
  }

  if (action === "decline") {
    const [updated] = await db
      .update(peers)
      .set({ status: "declined", updatedAt: new Date() })
      .where(eq(peers.id, id))
      .returning();
    return NextResponse.json(updated);
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
    .delete(peers)
    .where(
      and(
        eq(peers.id, id),
        or(eq(peers.requesterId, user.id), eq(peers.addresseeId, user.id))
      )
    );

  return NextResponse.json({ ok: true });
}
