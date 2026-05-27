import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

export async function getViewer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, user_id, name, phone, role, salary, bonus_pct, active, archived, created_at")
    .eq("user_id", user.id)
    .eq("archived", false)
    .maybeSingle();

  return { supabase, user, profile: (profile as Profile | null) ?? null };
}

export function hasRole(profile: Profile | null, allowed: UserRole[]) {
  return !!profile?.role && profile.active && !profile.archived && allowed.includes(profile.role);
}
