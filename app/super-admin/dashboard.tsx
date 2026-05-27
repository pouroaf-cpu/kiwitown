"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import BottomNav from "@/components/BottomNav";
import { createClient } from "@/lib/supabase/client";
import type { Profile, SystemSettings, UserRole } from "@/lib/types";

export default function SuperAdminDashboard({ viewer, initialSettings, initialStaff }: { viewer: Profile; initialSettings: SystemSettings; initialStaff: Profile[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [settings, setSettings] = useState(initialSettings);
  const [staff, setStaff] = useState(initialStaff);
  const [notice, setNotice] = useState("");

  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  async function saveBrand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      id: settings.id, business_name: form.get("business_name"), logo_url: form.get("logo_url") || null, brand_colour: form.get("brand_colour"), default_bonus_pct: Number(form.get("default_bonus_pct")),
    }) });
    const result = await response.json();
    if (!response.ok) return setNotice(result.error);
    setSettings(result);
    setNotice("Brand and global bonus defaults saved.");
  }

  async function setRole(profileId: string, role: UserRole | null) {
    const response = await fetch("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile_id: profileId, role }) });
    const result = await response.json();
    if (!response.ok) return setNotice(result.error);
    setStaff((current) => current.map((member) => member.id === profileId ? result : member));
    setNotice("Access role changed and audit logged.");
  }

  return (
    <div className="industrial-grid min-h-screen pb-24 md:pb-10">
      <TopNav role="super_admin" userName={viewer.name || "System owner"} onSignOut={signOut} />
      <main className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Platform administration</p>
        <div className="mt-3 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h1 className="font-display text-5xl uppercase text-white">System Owner</h1>
            <p className="mt-2 text-text-secondary">White-label configuration, owner access and global defaults.</p>
          </div>
          <Link href="/coo" className="primary-button !w-auto">Open COO operations</Link>
        </div>
        {notice && <p className="mt-7 rounded-xl border border-brand/20 bg-brand/10 p-4 text-sm text-brand">{notice}</p>}
        <div className="mt-8 grid gap-6 lg:grid-cols-[400px_1fr]">
          <form onSubmit={saveBrand} className="panel space-y-5 p-6">
            <div><p className="text-xs uppercase tracking-widest text-brand">White label</p><h2 className="mt-2 text-xl font-semibold">Business identity</h2></div>
            <label className="block text-xs uppercase tracking-widest text-text-secondary">Business name<input className="field mt-2" name="business_name" defaultValue={settings.business_name} required /></label>
            <label className="block text-xs uppercase tracking-widest text-text-secondary">Logo URL<input className="field mt-2" name="logo_url" defaultValue={settings.logo_url || ""} placeholder="https://..." /></label>
            <label className="block text-xs uppercase tracking-widest text-text-secondary">Brand colour<input className="field mt-2 h-14" name="brand_colour" type="color" defaultValue={settings.brand_colour} /></label>
            <label className="block text-xs uppercase tracking-widest text-text-secondary">Default bonus percent<input className="field mt-2" name="default_bonus_pct" type="number" step="0.01" min="0" defaultValue={settings.default_bonus_pct} /></label>
            <button className="primary-button">Save configuration</button>
          </form>
          <section className="panel overflow-hidden">
            <div className="border-b border-border p-5"><p className="text-xs uppercase tracking-widest text-brand">Role control</p><h2 className="mt-2 text-xl font-semibold">Access assignments</h2></div>
            {staff.map((member) => (
              <div className="flex flex-col gap-3 border-b border-border p-4 last:border-0 sm:flex-row sm:items-center" key={member.id}>
                <div className="flex-1"><p>{member.name || "Pending profile"}</p><p className="text-xs text-text-secondary">{member.phone}</p></div>
                <select className="field !w-auto min-w-44" value={member.role || ""} onChange={(event) => setRole(member.id, (event.target.value || null) as UserRole | null)}>
                  <option value="">Pending</option>
                  <option value="super_admin">Super admin</option>
                  <option value="coo">COO</option>
                  <option value="foreman">Foreman</option>
                  <option value="sparky">Sparky</option>
                </select>
              </div>
            ))}
          </section>
        </div>
      </main>
      <BottomNav role="super_admin" />
    </div>
  );
}
