import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { StretchClient } from "./stretch-client";

export const dynamic = "force-dynamic";

export default async function StretchPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <StretchClient />;
}
