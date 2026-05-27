export const preferredRegion = "syd1";

import { redirect } from "next/navigation";
import { getViewer, hasRole } from "@/lib/authorization";
import type { Profile, SystemSettings } from "@/lib/types";
import SuperAdminDashboard from "./dashboard";

export default async function SuperAdminPage() {
  const { supabase, user, profile } = await getViewer();
  if (!user) redirect("/login");
  if (!hasRole(profile, ["super_admin"])) redirect("/pending");
  const [{ data: settings }, { data: staff }] = await Promise.all([
    supabase.from("system_settings").select("*").eq("archived", false).limit(1).single(),
    supabase.from("profiles").select("*").eq("archived", false).order("name"),
  ]);
  return <SuperAdminDashboard viewer={profile!} initialSettings={settings as SystemSettings} initialStaff={(staff ?? []) as Profile[]} />;
}
