import Link from "next/link";

// Thin context bar for cross-role views (super_admin / COO opening another
// role's pages): shows what you're viewing + a way back to your own menu.
// Content is fully interactive so the pages can be tested.
export default function ReadOnlyFrame({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[80] flex items-center justify-between gap-3 border-b border-brand/30 bg-brand/10 px-4 py-2 text-sm backdrop-blur-2xl">
        <span className="truncate text-white">{label}</span>
        <Link href="/" className="shrink-0 rounded-lg bg-brand px-3 py-1 text-xs font-semibold text-background">
          Menu
        </Link>
      </div>
      <div className="pt-10">{children}</div>
    </>
  );
}
