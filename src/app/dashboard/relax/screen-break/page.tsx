import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ScreenBreakClient } from "./screen-break-client";

export const dynamic = "force-dynamic";

export default async function ScreenBreakPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <ScreenBreakClient />;
}
