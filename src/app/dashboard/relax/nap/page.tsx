import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { NapClient } from "./nap-client";

export const dynamic = "force-dynamic";

export default async function NapPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <NapClient />;
}
