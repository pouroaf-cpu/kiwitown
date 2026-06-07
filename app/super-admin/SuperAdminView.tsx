import type { ServerClient } from "@/lib/supabase/server";
import type { Profile, SystemSettings } from "@/lib/types";
import SuperAdminPanels from "./panels";

// Async data loader for the super_admin settings page. Rendered inside a
// <Suspense> boundary so its Supabase queries don't block the static frame
// (AppShell + header) from painting.
export default async function SuperAdminView({
  supabase,
}: {
  supabase: ServerClient;
}) {
  const [{ data: settings }, { data: staff }] = await Promise.all([
    supabase.from("system_settings").select("*").eq("archived", false).limit(1).single(),
    supabase.from("profiles").select("*").eq("archived", false).order("name"),
  ]);
  return <SuperAdminPanels initialSettings={settings as SystemSettings} initialStaff={(staff ?? []) as Profile[]} />;
}
