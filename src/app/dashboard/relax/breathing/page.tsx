import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { BreathingClient } from "./breathing-client";

export const dynamic = "force-dynamic";

export default async function BreathingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <BreathingClient />;
}
