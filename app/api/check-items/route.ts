export const preferredRegion = "syd1";

import { NextResponse } from "next/server";
import { getViewer, hasRole } from "@/lib/authorization";
import type { CheckItem } from "@/lib/types";

const ROLES = ["coo", "office_admin", "foreman", "sparky"];
const CADENCES = ["daily", "weekly", "monthly"];
const INPUTS = ["yes_no", "number", "currency", "date", "time", "text", "photo"];
const ALERT_ROLES = ["coo", "foreman"];

type ItemInput = Partial<Omit<CheckItem, "id" | "active" | "archived">> & { id?: string };

// Keep only the editable, validated fields.
function clean(body: ItemInput): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (body.role && ROLES.includes(body.role)) out.role = body.role;
  if (body.cadence && CADENCES.includes(body.cadence)) out.cadence = body.cadence;
  if (typeof body.label === "string") out.label = body.label.trim().slice(0, 200);
  if (body.input_type && INPUTS.includes(body.input_type)) out.input_type = body.input_type;
  const t = body.target;
  out.target = t === null || t === undefined || (t as unknown) === "" || !Number.isFinite(Number(t)) ? null : Number(t);
  out.unit = typeof body.unit === "string" && body.unit.trim() ? body.unit.trim().slice(0, 8) : null;
  out.due_day = body.due_day == null ? null : Math.min(7, Math.max(1, Number(body.due_day) || 0)) || null;
  out.due_time = typeof body.due_time === "string" && body.due_time ? body.due_time : null;
  out.critical = body.critical === true;
  out.alert_role = body.alert_role && ALERT_ROLES.includes(body.alert_role) ? body.alert_role : null;
  out.show_on_dashboard = body.show_on_dashboard === true;
  out.description = typeof body.description === "string" && body.description.trim() ? body.description.trim().slice(0, 2000) : null;
  out.draft = body.draft === true;
  if (body.order_index != null) out.order_index = Number(body.order_index) || 0;
  return out;
}

async function manager() {
  const { supabase, user, profile } = await getViewer();
  if (!user || !profile) return { supabase: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!hasRole(profile, ["coo", "super_admin", "office_admin"]))
    return { supabase: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { supabase, error: null };
}

// Read is open to any signed-in user (RLS already permits) so each role can
// load its own checklist; writes below stay manager-only.
export async function GET(request: Request) {
  const { supabase, user } = await getViewer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = new URL(request.url).searchParams.get("role");
  let q = supabase
    .from("check_items")
    .select("*")
    .eq("active", true)
    .eq("archived", false)
    .order("cadence")
    .order("order_index");
  if (role && ROLES.includes(role)) q = q.eq("role", role);
  const { data, error: e } = await q;
  return e ? NextResponse.json({ error: e.message }, { status: 500 }) : NextResponse.json({ items: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, error } = await manager();
  if (error) return error;
  const fields = clean((await request.json().catch(() => ({}))) as ItemInput);
  if (!fields.role || !fields.label)
    return NextResponse.json({ error: "Role and a name are required." }, { status: 400 });
  if (fields.order_index == null) {
    const { data: last } = await supabase!
      .from("check_items")
      .select("order_index")
      .eq("role", fields.role as string)
      .eq("cadence", (fields.cadence as string) ?? "daily")
      .eq("active", true)
      .eq("archived", false)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();
    fields.order_index = ((last?.order_index as number) ?? 0) + 10;
  }
  const { data, error: e } = await supabase!.from("check_items").insert(fields).select().single();
  return e ? NextResponse.json({ error: e.message }, { status: 500 }) : NextResponse.json(data);
}

// Edit = version it: archive the old row, insert a new one with merged fields.
// Past submissions keep referencing the old (archived) item id, so history on
// the server never changes.
export async function PATCH(request: Request) {
  const { supabase, error } = await manager();
  if (error) return error;
  const body = (await request.json().catch(() => ({}))) as ItemInput;
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { data: old } = await supabase!.from("check_items").select("*").eq("id", body.id).maybeSingle();
  if (!old) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  const merged = clean({ ...(old as CheckItem), ...body });
  const { error: aErr } = await supabase!.from("check_items").update({ active: false, archived: true }).eq("id", body.id);
  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });
  const { data, error: e } = await supabase!.from("check_items").insert(merged).select().single();
  return e ? NextResponse.json({ error: e.message }, { status: 500 }) : NextResponse.json(data);
}

// Reorder only — update order_index in place (order isn't history, so no versioning).
export async function PUT(request: Request) {
  const { supabase, error } = await manager();
  if (error) return error;
  const body = (await request.json().catch(() => ({}))) as { order?: { id: string; order_index: number }[] };
  const order = Array.isArray(body.order) ? body.order : [];
  for (const o of order) {
    if (!o?.id) continue;
    await supabase!.from("check_items").update({ order_index: Number(o.order_index) || 0 }).eq("id", o.id);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { supabase, error } = await manager();
  if (error) return error;
  const body = (await request.json().catch(() => ({}))) as { id?: string };
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { error: e } = await supabase!.from("check_items").update({ active: false, archived: true }).eq("id", body.id);
  return e ? NextResponse.json({ error: e.message }, { status: 500 }) : NextResponse.json({ ok: true });
}
