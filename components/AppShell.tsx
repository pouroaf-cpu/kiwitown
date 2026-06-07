"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/types";

type NavItem = { href: string; label: string };

// Primary nav per role. Settings + sign-out are appended in the menu itself.
const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  super_admin: [
    { href: "/", label: "Dashboard" },
    { href: "/super-admin", label: "System" },
    { href: "/coo", label: "Operations" },
    { href: "/office-admin", label: "Office" },
  ],
  coo: [
    { href: "/", label: "Dashboard" },
    { href: "/coo", label: "Operations" },
  ],
  office_admin: [
    { href: "/", label: "Dashboard" },
    { href: "/office-admin", label: "Office" },
  ],
  foreman: [
    { href: "/", label: "Dashboard" },
    { href: "/foreman", label: "Weekly check" },
  ],
  sparky: [{ href: "/", label: "My KPIs" }],
};

// Roles whose menu shows a Settings entry (user settings / system settings).
const SETTINGS_HREF: Partial<Record<UserRole, string>> = {
  super_admin: "/super-admin",
  coo: "/coo",
  office_admin: "/office-admin",
};

function GlassLogo() {
  return (
    <Link
      href="/"
      className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 shadow-lg backdrop-blur-2xl"
    >
      <span className="brand-mark">KE</span>
      <span className="font-display text-sm uppercase tracking-wide text-white">Kiwitown</span>
    </Link>
  );
}

export default function AppShell({
  role,
  userName,
  onSignOut,
  children,
}: {
  role: UserRole;
  userName: string;
  onSignOut: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = NAV_BY_ROLE[role];
  const settingsHref = SETTINGS_HREF[role];

  const NavBody = (
    <div className="flex h-full flex-col gap-1 p-4">
      <div className="mb-4 px-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand">Menu</p>
        <p className="mt-1 truncate text-sm font-medium text-white">{userName}</p>
      </div>
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active ? "bg-brand/15 text-brand" : "text-text-secondary hover:bg-white/5 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      {settingsHref && (
        <Link
          href={settingsHref}
          onClick={() => setOpen(false)}
          className="mt-1 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary transition hover:bg-white/5 hover:text-white"
        >
          Settings
        </Link>
      )}
      <button
        onClick={() => {
          setOpen(false);
          onSignOut();
        }}
        className="mt-auto rounded-xl border border-white/10 px-3 py-2.5 text-left text-sm font-medium text-text-secondary transition hover:bg-white/5 hover:text-white"
      >
        Sign out
      </button>
    </div>
  );

  return (
    <div className="min-h-screen industrial-grid">
      {/* Desktop: persistent glass side nav */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-white/[0.04] backdrop-blur-2xl md:block">
        {NavBody}
      </aside>

      {/* Burger (mobile) + glass logo (all sizes, top-right) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur-2xl md:hidden"
      >
        <span className="flex flex-col gap-1.5">
          <span className="block h-0.5 w-5 rounded-full bg-white" />
          <span className="block h-0.5 w-5 rounded-full bg-white" />
          <span className="block h-0.5 w-5 rounded-full bg-white" />
        </span>
      </button>
      <div className="fixed right-5 top-4 z-50">
        <GlassLogo />
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-white/10 bg-white/[0.06] backdrop-blur-2xl">
            {NavBody}
          </aside>
        </div>
      )}

      {/* Content */}
      <div className="md:pl-64">
        <div className="pt-20 md:pt-16">{children}</div>
      </div>
    </div>
  );
}
