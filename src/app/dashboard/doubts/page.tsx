import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DoubtsClient } from "./doubts-client";

export const dynamic = "force-dynamic";

export default async function DoubtsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <DoubtsClient me={user} />;
}
