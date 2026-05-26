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

  // Fetch profile to determine role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[root] ERR_CODE:", profileError.code);
    console.error("[root] ERR_MSG:", profileError.message);
    console.error("[root] ERR_HINT:", profileError.hint);
  }

  if (!profile?.role) {
    console.error("[root] PENDING — uid:", user.id, "profile_null:", profile === null, "role:", profile?.role);
    redirect("/pending");
  }

  switch (profile.role) {
    case "admin":
      redirect("/admin");
    case "foreman":
      redirect("/foreman");
    case "sparky":
      redirect("/sparky");
    default:
      redirect("/pending");
  }
}
