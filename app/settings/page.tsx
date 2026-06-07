export const preferredRegion = "syd1";

import { redirect } from "next/navigation";
import { getViewer, hasRole } from "@/lib/authorization";
import SuperAdminView from "@/app/super-admin/SuperAdminView";

// Settings is super_admin's landing (brand config, user management, all daily
// results). coo/office_admin access is added in stage 2.
export default async function SettingsPage() {
  const { supabase, user, profile } = await getViewer();
  if (!user) redirect("/login");
  if (!hasRole(profile, ["super_admin"])) redirect("/pending");
  return <SuperAdminView supabase={supabase} profile={profile!} />;
}
