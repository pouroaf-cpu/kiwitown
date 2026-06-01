import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

// Cached per-request (React cache): repeated reads in one render reuse the
// single profile query. Auth itself is already cheap — getClaims() verifies
// the JWT signature locally against the project's published ES256 public key,
// with no network round trip to the Auth server (unlike getUser()), while
// remaining safe to trust for protecting data.
export const getViewer = cache(async function getViewer() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return { supabase, user: null, profile: null };

  const user = {
    id: claims.sub as string,
    email: (claims.email as string | undefined) ?? null,
  };

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
