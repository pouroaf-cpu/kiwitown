import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

// Cached per-request: when a page or route handler reads the viewer more than
// once, it reuses the single auth + profile round-trip instead of repeating it.
export const getViewer = cache(async function getViewer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, user_id, name, email, phone, role, salary, bonus_pct, active, archived, created_at")
    .eq("user_id", user.id)
    .eq("archived", false)
    .maybeSingle();

  return { supabase, user, profile: (profile as Profile | null) ?? null };
});

export function hasRole(profile: Profile | null, allowed: UserRole[]) {
  return !!profile?.role && profile.active && !profile.archived && allowed.includes(profile.role);
}
