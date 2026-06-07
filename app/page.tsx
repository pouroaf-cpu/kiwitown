export const dynamic = "force-dynamic";
export const preferredRegion = "syd1";

import { redirect } from "next/navigation";
import { getViewer } from "@/lib/authorization";
import SparkyView from "./sparky/SparkyView";
import ForemanView from "./foreman/ForemanView";
import CooView from "./coo/CooView";
import SuperAdminView from "./super-admin/SuperAdminView";
import OfficeAdminView from "./office-admin/OfficeAdminView";

export default async function RootPage() {
  const { supabase, user, profile } = await getViewer();

  if (!user) redirect("/login");
  if (!profile?.role || !profile.active || profile.archived) redirect("/pending");

  // Render the role's dashboard directly — no redirect hop to /sparky etc.
  switch (profile.role) {
    case "super_admin":
      return <SuperAdminView supabase={supabase} profile={profile} />;
    case "coo":
      return <CooView supabase={supabase} profile={profile} />;
    case "office_admin":
      return <OfficeAdminView supabase={supabase} profile={profile} />;
    case "foreman":
      return <ForemanView supabase={supabase} profile={profile} />;
    case "sparky":
      return <SparkyView supabase={supabase} profile={profile} />;
    default:
      redirect("/pending");
  }
}
