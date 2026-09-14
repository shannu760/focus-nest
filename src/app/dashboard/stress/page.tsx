import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { stressCheckins } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { StressClient } from "./stress-client";

export const dynamic = "force-dynamic";

export default async function StressPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const rows = await db
    .select()
    .from(stressCheckins)
    .where(eq(stressCheckins.userId, user.id))
    .orderBy(desc(stressCheckins.createdAt))
    .limit(100);

  return <StressClient initialCheckins={rows} />;
}
