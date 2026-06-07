"use client";

import { FormEvent, useState } from "react";
import { ROLE_LABELS } from "@/lib/dailyChecks";
import type { Profile, UserRole } from "@/lib/types";

const CREATABLE: UserRole[] = ["coo", "office_admin", "foreman", "sparky"];

// The "user settings panel" — create logins + see staff. Available to
// super_admin, coo and office_admin. Account creation texts the new user a
// temporary password (handled server-side in POST /api/users).
export default function UserManagementPanel({
  initialStaff,
  canAssignSuperAdmin = false,
  showList = true,
}: {
  initialStaff: Profile[];
  canAssignSuperAdmin?: boolean;
  showList?: boolean;
}) {
  const [staff, setStaff] = useState(initialStaff);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("sparky");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const roleOptions = canAssignSuperAdmin ? (["super_admin", ...CREATABLE] as UserRole[]) : CREATABLE;

  async function createLogin(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create login.");
        return;
      }
      if (data.profile) setStaff((current) => [data.profile as Profile, ...current]);
      setNotice(data.warning ?? `Login created — a text was sent to ${phone.trim()}.`);
      setName("");
      setPhone("");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel p-5 md:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">User settings</p>
      <h2 className="mt-1 text-xl font-semibold text-white">Create a login</h2>
      <p className="mt-1 text-sm text-text-secondary">
        The new user gets a text with their username (mobile number) and a temporary password, and
        sets their own password on first sign-in.
      </p>

      <form onSubmit={createLogin} className="mt-4 grid gap-3 sm:grid-cols-2">
        <input className="field" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="field" placeholder="Mobile number" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <select className="field" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
          {roleOptions.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
        <button className="primary-button" disabled={busy} type="submit">
          {busy ? "Creating…" : "Create login & text"}
        </button>
      </form>

      {notice && <p className="mt-3 rounded-xl border border-brand/20 bg-brand/10 p-3 text-sm text-brand">{notice}</p>}
      {error && <p className="mt-3 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

      {showList && (
        <>
          <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-text-secondary">Staff ({staff.length})</p>
          <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">
            {staff.length === 0 && <p className="px-4 py-4 text-sm text-text-secondary">No staff yet.</p>}
            {staff.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{p.name || p.phone || p.email || "—"}</p>
                  <p className="text-xs text-text-secondary">{p.phone || p.email}</p>
                </div>
                <span className="text-xs font-semibold text-brand">{p.role ? ROLE_LABELS[p.role] : "No role"}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
