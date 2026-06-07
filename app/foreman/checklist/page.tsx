export const preferredRegion = "syd1";

import { redirect } from "next/navigation";
import { getViewer, hasRole } from "@/lib/authorization";
import ChecklistScreen from "@/components/ChecklistScreen";

export default async function ForemanChecklistPage() {
  const { user, profile } = await getViewer();
  if (!user) redirect("/login");
  if (!hasRole(profile, ["foreman"])) redirect("/pending");
  return <ChecklistScreen role="foreman" userName={profile!.name || profile!.phone || profile!.email || "Foreman"} />;
}
