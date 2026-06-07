export const preferredRegion = "syd1";

import { redirect } from "next/navigation";
import { getViewer, hasRole } from "@/lib/authorization";
import CooView from "./CooView";

export default async function CooPage() {
  const { supabase, user, profile } = await getViewer();
  if (!user) redirect("/login");
  if (!hasRole(profile, ["coo", "super_admin"])) redirect("/pending");
  return <CooView supabase={supabase} profile={profile!} showDailyCheck={false} />;
}
