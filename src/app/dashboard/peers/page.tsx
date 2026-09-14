import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PeersClient } from "./peers-client";

export const dynamic = "force-dynamic";

export default async function PeersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <PeersClient me={user} />;
}
