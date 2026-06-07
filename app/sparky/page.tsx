export const preferredRegion = "syd1";

import { redirect } from "next/navigation";
import { getViewer, hasRole } from "@/lib/authorization";
import SparkyView from "./SparkyView";

export default async function SparkyPage() {
  const { supabase, user, profile } = await getViewer();
  if (!user) redirect("/login");
  if (!hasRole(profile, ["sparky"])) redirect("/pending");
  return <SparkyView supabase={supabase} profile={profile!} showDailyCheck={false} />;
}
