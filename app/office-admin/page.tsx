export const preferredRegion = "syd1";

import { redirect } from "next/navigation";
import { getViewer, hasRole } from "@/lib/authorization";
import OfficeAdminView from "./OfficeAdminView";

export default async function OfficeAdminPage() {
  const { supabase, user, profile } = await getViewer();
  if (!user) redirect("/login");
  if (!hasRole(profile, ["office_admin", "super_admin"])) redirect("/pending");
  return <OfficeAdminView supabase={supabase} profile={profile!} />;
}
