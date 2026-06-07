"use client";

import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";
import type { UserRole } from "@/lib/types";

// Wraps content in the *viewer's* AppShell nav — used by cross-role pages
// (sparky roster, cross-role checklists) so super_admin / COO keep their own
// sidebar instead of the target role's.
export default function ViewerShell({
  navRole,
  userName,
  children,
}: {
  navRole: UserRole;
  userName: string;
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => createClient(), []);
  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/login");
  }
  return (
    <AppShell role={navRole} userName={userName} onSignOut={signOut}>
      {children}
    </AppShell>
  );
}
