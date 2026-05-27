export const dynamic = "force-dynamic";
export const preferredRegion = "syd1";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, active, archived")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.role || !profile.active || profile.archived) {
    redirect("/pending");
  }

  switch (profile.role) {
    case "super_admin":
      redirect("/super-admin");
    case "coo":
      redirect("/coo");
    case "foreman":
      redirect("/foreman");
    case "sparky":
      redirect("/sparky");
    default:
      redirect("/pending");
  }
}
