import type { ServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import OfficeAdminDashboard from "./dashboard";

export default async function OfficeAdminView({
  supabase,
  profile,
  showDailyCheck,
}: {
  supabase: ServerClient;
  profile: Profile;
  showDailyCheck?: boolean;
}) {
  const { data: staff } = await supabase
    .from("profiles")
    .select("*")
    .eq("archived", false)
    .order("name");
  return <OfficeAdminDashboard viewer={profile} initialStaff={(staff ?? []) as Profile[]} showDailyCheck={showDailyCheck} />;
}
