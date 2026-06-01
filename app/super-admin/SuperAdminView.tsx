import type { ServerClient } from "@/lib/supabase/server";
import type { Profile, SystemSettings } from "@/lib/types";
import SuperAdminDashboard from "./dashboard";

export default async function SuperAdminView({
  supabase,
  profile,
}: {
  supabase: ServerClient;
  profile: Profile;
}) {
  const [{ data: settings }, { data: staff }] = await Promise.all([
    supabase.from("system_settings").select("*").eq("archived", false).limit(1).single(),
    supabase.from("profiles").select("*").eq("archived", false).order("name"),
  ]);
  return <SuperAdminDashboard viewer={profile} initialSettings={settings as SystemSettings} initialStaff={(staff ?? []) as Profile[]} />;
}
