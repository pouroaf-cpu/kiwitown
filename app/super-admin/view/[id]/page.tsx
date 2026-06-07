export const preferredRegion = "syd1";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer, hasRole } from "@/lib/authorization";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";
import SparkyView from "@/app/sparky/SparkyView";
import ForemanView from "@/app/foreman/ForemanView";
import CooView from "@/app/coo/CooView";
import OfficeAdminView from "@/app/office-admin/OfficeAdminView";

// super_admin "view as": render any person's dashboard read-through, using the
// super_admin's own (all-access) session. The role View fetches that person's
// data by their profile id; RLS permits super_admin to read it.
export default async function ViewAsPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase, user, profile } = await getViewer();
  if (!user) redirect("/login");
  if (!hasRole(profile, ["super_admin"])) redirect("/pending");

  const { id } = await params;
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!data) redirect("/super-admin");
  const target = data as Profile;

  const inner =
    target.role === "sparky" ? <SparkyView supabase={supabase} profile={target} /> :
    target.role === "foreman" ? <ForemanView supabase={supabase} profile={target} /> :
    target.role === "coo" ? <CooView supabase={supabase} profile={target} /> :
    target.role === "office_admin" ? <OfficeAdminView supabase={supabase} profile={target} /> :
    null;
  if (!inner) redirect("/super-admin");

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[70] flex items-center justify-between gap-3 border-b border-brand/30 bg-brand/15 px-4 py-2 text-sm backdrop-blur-2xl">
        <span className="truncate text-white">
          Viewing as <span className="font-semibold">{target.name || target.phone || "—"}</span>
        </span>
        <Link href="/super-admin" className="shrink-0 rounded-lg bg-brand px-3 py-1 text-xs font-semibold text-background">
          Exit
        </Link>
      </div>
      {inner}
    </>
  );
}
