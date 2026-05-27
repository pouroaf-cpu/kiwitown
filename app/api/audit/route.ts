export const preferredRegion = "syd1";

import { NextResponse } from "next/server";
import { getViewer, hasRole } from "@/lib/authorization";

export async function GET() {
  const { supabase, user, profile } = await getViewer();
  if (!user || !hasRole(profile, ["coo", "super_admin"])) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data, error } = await supabase.from("audit_log").select("id,user_id,action,table_name,record_id,created_at").order("created_at", { ascending: false }).limit(100);
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json(data);
}
