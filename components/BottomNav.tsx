"use client";

import Link from "next/link";
import type { UserRole } from "@/lib/types";

const homeForRole: Record<UserRole, { href: string; label: string }> = {
  super_admin: { href: "/super-admin", label: "System" },
  coo: { href: "/coo", label: "Operations" },
  foreman: { href: "/foreman", label: "Weekly check" },
  sparky: { href: "/sparky", label: "My KPIs" },
};

export default function BottomNav({ role }: { role: UserRole }) {
  const item = homeForRole[role];
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 p-3 backdrop-blur-xl md:hidden">
      <Link href={item.href} className="flex items-center justify-center gap-3 rounded-xl bg-brand/10 py-3 text-sm font-semibold text-brand">
        <span className="h-2 w-2 rounded-full bg-brand" />
        {item.label}
      </Link>
    </nav>
  );
}
