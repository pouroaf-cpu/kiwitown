export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  const supabase = createClient();
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
    console.error("[root] profile query error:", profileError.message, profileError.code);
  }

  if (!profile?.role) {
    console.error("[root] no role — user:", user.id, "profile:", profile, "error:", profileError?.message);
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
