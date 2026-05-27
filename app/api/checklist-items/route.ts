export const preferredRegion = "syd1";

import { NextResponse } from "next/server";
import { getViewer, hasRole } from "@/lib/authorization";

export async function GET() {
  const { supabase, user } = await getViewer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("checklist_items").select("*").eq("archived", false).order("order_index");
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json(data);
}

export async function POST(request: Request) {
  const { supabase, user, profile } = await getViewer();
  if (!user || !hasRole(profile, ["coo", "super_admin"])) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json() as { label?: string; category?: string; colour?: string; order_index?: number };
  if (!body.label?.trim() || !body.category?.trim()) return NextResponse.json({ error: "Label and category are required" }, { status: 400 });
  const { data, error } = await supabase.from("checklist_items").insert({
    label: body.label.trim(),
    category: body.category.trim(),
    colour: body.colour || "#00AEEF",
    order_index: body.order_index ?? 0,
  }).select().single();
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const { supabase, user, profile } = await getViewer();
  if (!user || !hasRole(profile, ["coo", "super_admin"])) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json() as { id?: string; label?: string; category?: string; colour?: string; order_index?: number; active?: boolean; archived?: boolean };
  if (!body.id) return NextResponse.json({ error: "Missing item id" }, { status: 400 });
  const { id, ...updates } = body;
  const { data, error } = await supabase.from("checklist_items").update(updates).eq("id", id).select().single();
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json(data);
}
