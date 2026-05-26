"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin",   label: "Admin",   icon: "⚙️" },
  { href: "/foreman", label: "Checklist", icon: "📋" },
  { href: "/sparky",  label: "Sparky",  icon: "⚡" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl border-t border-border safe-bottom">
      <div className="flex items-stretch h-16 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors active:opacity-70 ${
                active ? "text-brand" : "text-text-muted"
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className={`text-[10px] font-semibold tracking-wide ${active ? "text-brand" : "text-text-muted"}`}>
                {item.label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-brand rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
