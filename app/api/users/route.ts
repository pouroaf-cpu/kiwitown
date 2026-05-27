export const preferredRegion = "syd1";

import { NextResponse } from "next/server";
import { getViewer, hasRole } from "@/lib/authorization";
import type { UserRole } from "@/lib/types";

const roles: (UserRole | null)[] = ["super_admin", "coo", "foreman", "sparky", null];

export async function GET() {
  const { supabase, user, profile } = await getViewer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(profile, ["coo", "super_admin"])) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data, error } = await supabase.from("profiles").select("*").eq("archived", false).order("created_at");
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const { supabase, user, profile } = await getViewer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(profile, ["coo", "super_admin"])) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json() as { profile_id?: string; role?: UserRole | null; active?: boolean; archived?: boolean };
  if (!body.profile_id) return NextResponse.json({ error: "Missing profile_id" }, { status: 400 });
  if (body.role !== undefined && !roles.includes(body.role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  if (body.role === "super_admin" && profile?.role !== "super_admin") {
    const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "super_admin").eq("active", true).eq("archived", false);
    if ((count ?? 0) > 0) {
      return NextResponse.json({ error: "Only a system owner can assign owner access" }, { status: 403 });
    }
  }
  const updates: { role?: UserRole | null; active?: boolean; archived?: boolean } = {};
  if (body.role !== undefined) updates.role = body.role;
  if (body.active !== undefined) updates.active = body.active;
  if (body.archived !== undefined) updates.archived = body.archived;
  const { data, error } = await supabase.from("profiles").update(updates).eq("id", body.profile_id).select().single();
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json(data);
}
