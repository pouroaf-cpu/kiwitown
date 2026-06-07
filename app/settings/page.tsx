export const preferredRegion = "syd1";

import { redirect } from "next/navigation";
import { getViewer, hasRole } from "@/lib/authorization";
import SuperAdminView from "@/app/super-admin/SuperAdminView";
import SettingsLite from "@/components/SettingsLite";
import type { Profile } from "@/lib/types";

// super_admin: full settings (brand + users + all daily results).
// coo / office_admin: user settings (create + manage logins).
export default async function SettingsPage() {
  const { supabase, user, profile } = await getViewer();
  if (!user) redirect("/login");
  if (!hasRole(profile, ["super_admin", "coo", "office_admin"])) redirect("/pending");
  if (profile!.role === "super_admin") return <SuperAdminView supabase={supabase} profile={profile!} />;

  const { data: staff } = await supabase.from("profiles").select("*").eq("archived", false).order("name");
  return (
    <SettingsLite
      role={profile!.role!}
      userName={profile!.name || profile!.phone || "Settings"}
      initialStaff={(staff ?? []) as Profile[]}
    />
  );
}
