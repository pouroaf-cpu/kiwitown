export const preferredRegion = "syd1";

import { redirect } from "next/navigation";
import { getViewer, hasRole } from "@/lib/authorization";
import SuperAdminView from "./SuperAdminView";

export default async function SuperAdminPage() {
  const { supabase, user, profile } = await getViewer();
  if (!user) redirect("/login");
  if (!hasRole(profile, ["super_admin"])) redirect("/pending");
  return <SuperAdminView supabase={supabase} profile={profile!} />;
}
