"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin",   label: "Admin" },
  { href: "/foreman", label: "Checklist" },
  { href: "/sparky",  label: "Sparky" },
];

interface Props {
  userName: string;
  onSignOut: () => void;
}

export default function TopNav({ userName, onSignOut }: Props) {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex sticky top-0 z-30 items-center h-14 px-8 bg-bg/95 backdrop-blur-xl border-b border-border shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-2.5 mr-8 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
          <svg width="15" height="15" viewBox="0 0 32 32" fill="none">
            <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" fill="white" opacity="0.9" />
            <path d="M12 16L15 19L20 13" stroke="#0B0D12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="font-bold text-text-primary text-sm tracking-tight">Kiwitown</span>
      </div>

      {/* Nav links */}
      <nav className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-brand/10 text-brand border border-brand/20"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/5"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-4">
        <span className="text-sm text-text-secondary truncate max-w-[180px]">{userName}</span>
        <button
          onClick={onSignOut}
          className="text-xs text-text-secondary px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-muted transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
