export const preferredRegion = "syd1";

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getViewer, hasRole } from "@/lib/authorization";
import SuperAdminDashboard, { SuperAdminPanelsSkeleton } from "./dashboard";
import SuperAdminView from "./SuperAdminView";

export default async function SuperAdminPage() {
  const { supabase, user, profile } = await getViewer();
  if (!user) redirect("/login");
  if (!hasRole(profile, ["super_admin"])) redirect("/pending");
  // Static frame paints immediately; data panels stream in via Suspense.
  return (
    <SuperAdminDashboard viewer={profile!}>
      <Suspense fallback={<SuperAdminPanelsSkeleton />}>
        <SuperAdminView supabase={supabase} />
      </Suspense>
    </SuperAdminDashboard>
  );
}
