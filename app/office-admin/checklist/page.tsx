export const preferredRegion = "syd1";

import { redirect } from "next/navigation";
import { getViewer, hasRole } from "@/lib/authorization";
import ChecklistScreen from "@/components/ChecklistScreen";

export default async function OfficeAdminChecklistPage() {
  const { user, profile } = await getViewer();
  if (!user) redirect("/login");
  if (!hasRole(profile, ["office_admin"])) redirect("/pending");
  return <ChecklistScreen role="office_admin" userName={profile!.name || profile!.phone || profile!.email || "Office admin"} />;
}
