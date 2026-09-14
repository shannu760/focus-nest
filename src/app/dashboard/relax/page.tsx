import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { relaxActivities } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { RelaxClient } from "./relax-client";

export const dynamic = "force-dynamic";

export default async function RelaxPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const rows = await db
    .select()
    .from(relaxActivities)
    .where(eq(relaxActivities.userId, user.id))
    .orderBy(desc(relaxActivities.completedAt))
    .limit(100);

  return <RelaxClient initialActivities={rows} />;
}
