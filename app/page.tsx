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
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile?.role) {
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
