import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { WalkClient } from "./walk-client";

export const dynamic = "force-dynamic";

export default async function WalkPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <WalkClient />;
}
