export const preferredRegion = "syd1";

import { redirect } from "next/navigation";
import { getViewer, hasRole } from "@/lib/authorization";
import SettingsHub from "@/components/SettingsHub";

// Settings as a menu of sections (Profile / Create login / Role control /
// White label), each opening a full-screen sheet in the Task Editor format.
// The menu needs no data, so it renders immediately; each sheet loads its own
// data on open (keeps the page off the slow DB critical path).
export default async function SettingsPage() {
  const { user, profile } = await getViewer();
  if (!user) redirect("/login");
  if (!hasRole(profile, ["super_admin", "coo", "office_admin"])) redirect("/pending");

  return <SettingsHub viewer={profile!} />;
}
