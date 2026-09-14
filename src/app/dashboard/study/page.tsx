import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { studySessions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { StudyClient } from "./study-client";

export const dynamic = "force-dynamic";

export default async function StudyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const rows = await db
    .select()
    .from(studySessions)
    .where(eq(studySessions.userId, user.id))
    .orderBy(desc(studySessions.completedAt))
    .limit(100);

  return <StudyClient initialSessions={rows} />;
}
