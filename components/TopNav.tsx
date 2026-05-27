"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/types";

const linksByRole: Record<UserRole, { href: string; label: string }[]> = {
  super_admin: [
    { href: "/super-admin", label: "System" },
    { href: "/coo", label: "Operations" },
  ],
  coo: [{ href: "/coo", label: "Operations" }],
  foreman: [{ href: "/foreman", label: "Weekly check" }],
  sparky: [{ href: "/sparky", label: "My KPIs" }],
};

export default function TopNav({ userName, role, onSignOut }: { userName: string; role: UserRole; onSignOut: () => void }) {
  const pathname = usePathname();
  return (
    <header className="hidden h-16 items-center border-b border-border bg-bg/90 px-8 backdrop-blur-xl md:flex">
      <Link href="/" className="flex items-center gap-3">
        <span className="brand-mark">KE</span>
        <div>
          <p className="font-display text-lg uppercase leading-none text-white">Kiwitown</p>
          <p className="text-[10px] uppercase tracking-[0.25em] text-text-secondary">Electrical</p>
        </div>
      </Link>
      <nav className="ml-12 flex items-center gap-2">
        {linksByRole[role].map((item) => (
          <Link key={item.href} href={item.href} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${pathname.startsWith(item.href) ? "bg-brand/10 text-brand" : "text-text-secondary hover:bg-white/5 hover:text-white"}`}>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-5 text-sm">
        <span className="text-text-secondary">{userName}</span>
        <button className="secondary-button !w-auto !px-4 !py-2" onClick={onSignOut}>Sign out</button>
      </div>
    </header>
  );
}
