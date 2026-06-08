export const preferredRegion = "syd1";

import { redirect } from "next/navigation";
import { getViewer, hasRole } from "@/lib/authorization";

// Super-admin settings now live at /settings (the unified hub).
export default async function SuperAdminPage() {
  const { user, profile } = await getViewer();
  if (!user) redirect("/login");
  if (!hasRole(profile, ["super_admin"])) redirect("/pending");
  redirect("/settings");
}
