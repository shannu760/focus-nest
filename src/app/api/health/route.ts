import { db, ensureDbReady } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDbReady();
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, timestamp: new Date().toISOString() });
  } catch (err: any) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
