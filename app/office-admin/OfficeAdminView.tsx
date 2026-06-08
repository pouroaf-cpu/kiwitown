import { Suspense } from "react";
import type { ServerClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";
import OfficeAdminFrame, { OfficeAdminSkeleton } from "./dashboard";
import OfficeAdminPanels from "./panels";

// Async data loader — suspends on the staff query; rendered inside the frame's
// <Suspense> boundary so it doesn't block the frame from painting.
async function OfficeAdminData({ supabase, showDailyCheck }: { supabase: ServerClient; showDailyCheck?: boolean }) {
  const { data: staff } = await supabase.from("profiles").select("*").eq("archived", false).order("name");
  return <OfficeAdminPanels initialStaff={(staff ?? []) as Profile[]} showDailyCheck={showDailyCheck} />;
}

export default function OfficeAdminView({
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
  return (
    <OfficeAdminFrame viewer={profile} navRole={navRole}>
      <Suspense fallback={<OfficeAdminSkeleton />}>
        <OfficeAdminData supabase={supabase} showDailyCheck={showDailyCheck} />
      </Suspense>
    </OfficeAdminFrame>
  );
}
