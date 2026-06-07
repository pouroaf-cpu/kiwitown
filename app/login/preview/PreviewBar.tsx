// Small fixed pill shown on every preview dashboard so you can jump back to the
// preview menu. Part of the no-auth preview — safe to delete with the folder.
import Link from "next/link";

export default function PreviewBar({ role }: { role: string }) {
  return (
    <div className="fixed top-2 right-2 z-[60] flex items-center gap-2 rounded-full border border-brand/40 bg-black/70 px-3 py-1.5 text-xs font-semibold text-brand backdrop-blur">
      <span className="hidden sm:inline uppercase tracking-widest">Preview</span>
      <span className="text-text-secondary">·</span>
      <span className="text-white">{role} (demo data)</span>
      <Link href="/login/preview" className="ml-1 rounded-full bg-brand px-2 py-0.5 text-background">
        Menu
      </Link>
    </div>
  );
}
