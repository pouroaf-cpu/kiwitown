"use client";

import { FormEvent, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import SettingsSheet from "@/components/SettingsSheet";
import ProfileEditor from "@/components/ProfileEditor";
import UserManagementPanel from "@/components/UserManagementPanel";
import { createClient } from "@/lib/supabase/client";
import { ROLE_LABELS } from "@/lib/dailyChecks";
import type { Profile, SystemSettings, UserRole } from "@/lib/types";

type Section = "profile" | "create" | "roles" | "whitelabel";
const ROLE_OPTIONS: (UserRole | "")[] = ["", "super_admin", "coo", "office_admin", "foreman", "sparky"];

// Settings as a menu of sections. Each opens a full-screen sheet in the same
// format as the Task Editor. Sections shown depend on role. The menu needs no
// data; each sheet lazy-loads its own data on open, so /settings stays off the
// DB critical path and renders instantly.
export default function SettingsHub({ viewer }: { viewer: Profile }) {
  const supabase = useMemo(() => createClient(), []);
  const [open, setOpen] = useState<Section | null>(null);
  const [staff, setStaff] = useState<Profile[] | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [notice, setNotice] = useState("");
  const [savingBrand, setSavingBrand] = useState(false);
  const isSuper = viewer.role === "super_admin";

  async function openSection(id: Section) {
    setOpen(id);
    if (id === "roles" && !staff) {
      const { data } = await supabase.from("profiles").select("*").eq("archived", false).order("name");
      setStaff((data ?? []) as Profile[]);
    }
    if (id === "whitelabel" && !settings) {
      const { data } = await supabase.from("system_settings").select("*").eq("archived", false).limit(1).single();
      setSettings((data ?? null) as SystemSettings | null);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  async function setRole(profileId: string, role: string) {
    const res = await fetch("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile_id: profileId, role: role || null }) });
    const result = await res.json();
    if (!res.ok) return setNotice(result.error || "Could not update role.");
    setStaff((cur) => (cur ? cur.map((m) => (m.id === profileId ? result : m)) : cur));
    setNotice("Access role changed and audit logged.");
  }

  async function saveBrand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;
    setSavingBrand(true);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: settings.id,
        business_name: form.get("business_name"),
        logo_url: form.get("logo_url") || null,
        brand_colour: form.get("brand_colour"),
        default_bonus_pct: Number(form.get("default_bonus_pct")),
      }),
    });
    const result = await res.json();
    setSavingBrand(false);
    if (!res.ok) return setNotice(result.error || "Could not save.");
    setSettings(result);
    setNotice("Brand and global defaults saved.");
    setOpen(null);
  }

  const sections: { id: Section; icon: string; label: string; desc: string; show: boolean }[] = [
    { id: "profile", icon: "👤", label: "Profile", desc: "Your photo, name, nickname and password", show: true },
    { id: "create", icon: "➕", label: "Create user login", desc: "Add a new staff login", show: true },
    { id: "roles", icon: "🛡", label: "Role control", desc: "Assign roles and access", show: isSuper },
    { id: "whitelabel", icon: "🎨", label: "White label", desc: "Business identity and brand", show: isSuper },
  ];

  return (
    <AppShell role={viewer.role!} userName={viewer.nickname || viewer.name || viewer.phone || "Settings"} onSignOut={signOut}>
      <div className="mx-auto max-w-3xl px-5 pb-28 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Settings</p>
        <h1 className="mt-3 font-display text-4xl uppercase text-white md:text-5xl">Settings</h1>

        {notice && <p className="mt-6 rounded-xl border border-brand/20 bg-brand/10 p-3 text-sm text-brand">{notice}</p>}

        <div className="mt-8 overflow-hidden rounded-2xl border border-border">
          {sections.filter((s) => s.show).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => openSection(s.id)}
              className="flex w-full items-center gap-4 border-b border-border px-4 py-4 text-left transition last:border-0 hover:bg-white/5"
            >
              <span className="text-xl" aria-hidden>{s.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-white">{s.label}</span>
                <span className="block truncate text-xs text-text-secondary">{s.desc}</span>
              </span>
              <span className="text-text-secondary">›</span>
            </button>
          ))}
        </div>
      </div>

      {open === "profile" && (
        <ProfileEditor
          initial={{
            id: viewer.id,
            name: viewer.name,
            nickname: viewer.nickname ?? null,
            avatar_url: viewer.avatar_url ?? null,
            phone: viewer.phone,
            email: viewer.email,
            role: viewer.role,
          }}
          onClose={() => setOpen(null)}
          onSaved={() => window.location.reload()}
        />
      )}

      {open === "create" && (
        <SettingsSheet title="Create user login" onClose={() => setOpen(null)}>
          <UserManagementPanel initialStaff={staff ?? []} showList={false} canAssignSuperAdmin={isSuper} />
        </SettingsSheet>
      )}

      {open === "roles" && (
        <SettingsSheet title="Role control" onClose={() => setOpen(null)}>
          {!staff ? (
            <p className="text-sm text-text-secondary">Loading…</p>
          ) : (
            <>
              <p className="text-sm text-text-secondary">Assign each person&apos;s role. Changes are audit-logged.</p>
              <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border">
                {staff.map((member) => (
                  <div key={member.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{member.nickname || member.name || "Pending profile"}</p>
                      <p className="text-xs text-text-secondary">{member.email || member.phone || "No contact recorded"}</p>
                    </div>
                    <select
                      className="field !w-auto min-w-44"
                      value={member.role || ""}
                      onChange={(e) => setRole(member.id, e.target.value)}
                      disabled={member.id === viewer.id}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r || "none"} value={r}>{r ? ROLE_LABELS[r as UserRole] : "Pending"}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </>
          )}
        </SettingsSheet>
      )}

      {open === "whitelabel" && (
        <SettingsSheet title="White label" onClose={() => setOpen(null)} onSave={settings ? () => (document.getElementById("white-label-form") as HTMLFormElement | null)?.requestSubmit() : undefined} saving={savingBrand}>
          {!settings ? (
            <p className="text-sm text-text-secondary">Loading…</p>
          ) : (
          <form id="white-label-form" onSubmit={saveBrand} className="space-y-5">
            <label className="block text-xs uppercase tracking-widest text-text-secondary">
              Business name
              <input className="field mt-2" name="business_name" defaultValue={settings.business_name} required />
            </label>
            <label className="block text-xs uppercase tracking-widest text-text-secondary">
              Logo URL
              <input className="field mt-2" name="logo_url" defaultValue={settings.logo_url || ""} placeholder="https://…" />
            </label>
            <label className="block text-xs uppercase tracking-widest text-text-secondary">
              Brand colour
              <input className="field mt-2 h-14" name="brand_colour" type="color" defaultValue={settings.brand_colour} />
            </label>
            <label className="block text-xs uppercase tracking-widest text-text-secondary">
              Default bonus percent
              <input className="field mt-2" name="default_bonus_pct" type="number" step="0.01" min="0" defaultValue={settings.default_bonus_pct} />
            </label>
            <button type="submit" className="primary-button w-full" disabled={savingBrand}>{savingBrand ? "Saving…" : "Save configuration"}</button>
          </form>
          )}
        </SettingsSheet>
      )}
    </AppShell>
  );
}
