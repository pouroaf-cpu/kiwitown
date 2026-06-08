"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationPrompt from "@/components/NotificationPrompt";
import type { UserRole } from "@/lib/types";

type NavItem = { href: string; label: string };

// Primary nav per role. Settings + sign-out are appended in the menu itself.
// Read-only cross-role views live under /roles/[role]. super_admin + COO see
// everyone; COO's own pages link to the editable /coo routes.
const ALL_ACCESS: NavItem[] = [
  { href: "/roles/coo", label: "COO · Dashboard" },
  { href: "/roles/coo/checklist", label: "COO · Checklist" },
  { href: "/roles/foreman", label: "Ops · Dashboard" },
  { href: "/roles/foreman/checklist", label: "Ops · Checklist" },
  { href: "/roles/office-admin", label: "Office · Dashboard" },
  { href: "/roles/office-admin/checklist", label: "Office · Checklist" },
  { href: "/roles/sparky", label: "Sparky · Dashboard" },
  { href: "/roles/sparky/checklist", label: "Sparky · Checklist" },
];

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  super_admin: [
    { href: "/settings", label: "Settings" },
    { href: "/task-editor", label: "Task editor" },
    ...ALL_ACCESS,
  ],
  coo: [
    { href: "/coo", label: "My Dashboard" },
    { href: "/coo/checklist", label: "My Checklist" },
    { href: "/roles/foreman", label: "Ops · Dashboard" },
    { href: "/roles/foreman/checklist", label: "Ops · Checklist" },
    { href: "/roles/office-admin", label: "Office · Dashboard" },
    { href: "/roles/office-admin/checklist", label: "Office · Checklist" },
    { href: "/roles/sparky", label: "Sparky · Dashboard" },
    { href: "/roles/sparky/checklist", label: "Sparky · Checklist" },
    { href: "/task-editor", label: "Task editor" },
    { href: "/settings", label: "Settings" },
  ],
  office_admin: [
    { href: "/office-admin", label: "Dashboard" },
    { href: "/office-admin/checklist", label: "Checklist" },
    { href: "/task-editor", label: "Task editor" },
    { href: "/settings", label: "Settings" },
  ],
  foreman: [
    { href: "/foreman", label: "Dashboard" },
    { href: "/foreman/checklist", label: "Checklist" },
  ],
  sparky: [
    { href: "/sparky", label: "Dashboard" },
    { href: "/sparky/checklist", label: "Checklist" },
  ],
};

function GlassLogo() {
  return (
    <Link href="/" className="pointer-events-auto flex items-center gap-2">
      <span className="brand-mark">KE</span>
      <span className="font-display text-sm uppercase tracking-wide text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">Kiwitown</span>
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
  const [scrolled, setScrolled] = useState(false);
  const items = NAV_BY_ROLE[role];

  // Fade the corner logo out as the page scrolls down.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const NavBody = (
    <div className="flex h-full flex-col gap-1 p-4">
      <div className="mb-4 px-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand">Menu</p>
        <p className="mt-1 truncate text-sm font-medium text-white">{userName}</p>
      </div>
      {items.map((item) => {
        const active = pathname === item.href;
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
      <div className="mt-auto flex flex-col gap-2 pt-2">
        <NotificationPrompt label="Enable alerts" enabledLabel="Alerts on" />
        <button
          onClick={() => {
            setOpen(false);
            onSignOut();
          }}
          className="rounded-xl border border-white/10 px-3 py-2.5 text-left text-sm font-medium text-text-secondary transition hover:bg-white/5 hover:text-white"
        >
          Sign out
        </button>
      </div>
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
      <div
        className={`fixed right-5 top-4 z-50 transition-opacity duration-500 ${
          scrolled ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <GlassLogo />
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-white/10 bg-white/[0.06] backdrop-blur-2xl">
            <div className="px-3 pt-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-lg leading-none text-white"
              >
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{NavBody}</div>
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
