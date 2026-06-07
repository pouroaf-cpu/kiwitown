import type { ServerClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";
import OfficeAdminDashboard from "./dashboard";

export default async function OfficeAdminView({
  supabase,
  profile,
  showDailyCheck,
  navRole,
}: {
  supabase: ServerClient;
  profile: Profile;
  showDailyCheck?: boolean;
  navRole?: UserRole;
}) {
  const { data: staff } = await supabase
    .from("profiles")
    .select("*")
    .eq("archived", false)
    .order("name");
  return <OfficeAdminDashboard viewer={profile} initialStaff={(staff ?? []) as Profile[]} showDailyCheck={showDailyCheck} navRole={navRole} />;
}
