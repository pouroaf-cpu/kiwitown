"use client";

import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";
import UserManagementPanel from "@/components/UserManagementPanel";
import type { Profile, UserRole } from "@/lib/types";

// Settings for coo / office_admin — user management (create + manage logins).
export default function SettingsLite({
  role,
  userName,
  initialStaff,
}: {
  role: UserRole;
  userName: string;
  initialStaff: Profile[];
}) {
  const supabase = useMemo(() => createClient(), []);
  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/login");
  }
  return (
    <AppShell role={role} userName={userName} onSignOut={signOut}>
      <div className="mx-auto max-w-3xl px-5 pb-28 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Settings</p>
        <h1 className="mt-3 font-display text-4xl uppercase text-white md:text-5xl">User settings</h1>
        <div className="mt-8">
          <UserManagementPanel initialStaff={initialStaff} />
        </div>
      </div>
    </AppShell>
  );
}
