import Link from "next/link";

// Wraps a cross-role view so super_admin / COO can look but not touch: a banner
// with a Back link, and the content frozen with pointer-events-none.
export default function ReadOnlyFrame({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[80] flex items-center justify-between gap-3 border-b border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm backdrop-blur-2xl">
        <span className="truncate text-white">
          Read only · <span className="font-semibold">{label}</span>
        </span>
        <Link href="/" className="shrink-0 rounded-lg bg-brand px-3 py-1 text-xs font-semibold text-background">
          Back
        </Link>
      </div>
      <div className="pointer-events-none select-none pt-10">{children}</div>
    </>
  );
}
