export const preferredRegion = "syd1";

import { redirect } from "next/navigation";
import { getViewer, hasRole } from "@/lib/authorization";
import SettingsHub from "@/components/SettingsHub";
import type { Profile, SystemSettings } from "@/lib/types";

// Settings as a menu of sections (Profile / Create login / Role control /
// White label), each opening a full-screen sheet in the Task Editor format.
export default async function SettingsPage() {
  const { supabase, user, profile } = await getViewer();
  if (!user) redirect("/login");
  if (!hasRole(profile, ["super_admin", "coo", "office_admin"])) redirect("/pending");

  const isSuper = profile!.role === "super_admin";
  const [{ data: staff }, settingsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("archived", false).order("name"),
    isSuper
      ? supabase.from("system_settings").select("*").eq("archived", false).limit(1).single()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <SettingsHub
      viewer={profile!}
      initialStaff={(staff ?? []) as Profile[]}
      initialSettings={(settingsRes.data ?? null) as SystemSettings | null}
    />
  );
}
