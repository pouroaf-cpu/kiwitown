export const preferredRegion = "syd1";

import { redirect } from "next/navigation";
import { getViewer, hasRole } from "@/lib/authorization";
import TaskEditor from "@/components/TaskEditor";

export default async function TaskEditorPage() {
  const { user, profile } = await getViewer();
  if (!user) redirect("/login");
  if (!hasRole(profile, ["coo", "super_admin", "office_admin"])) redirect("/pending");
  return <TaskEditor navRole={profile!.role!} userName={profile!.name || profile!.phone || "Editor"} />;
}
