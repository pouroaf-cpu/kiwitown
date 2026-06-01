export const preferredRegion = "syd1";

import { redirect } from "next/navigation";
import { getViewer, hasRole } from "@/lib/authorization";
import ForemanView from "./ForemanView";

export default async function ForemanPage() {
  const { supabase, user, profile } = await getViewer();
  if (!user) redirect("/login");
  if (!hasRole(profile, ["foreman"])) redirect("/pending");
  return <ForemanView supabase={supabase} profile={profile!} />;
}
