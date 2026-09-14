import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { MusicClient } from "./music-client";

export const dynamic = "force-dynamic";

export default async function MusicPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <MusicClient />;
}
