export const preferredRegion = "syd1";

import { NextResponse } from "next/server";
import { getViewer } from "@/lib/authorization";

export async function POST(request: Request) {
  const { supabase, user } = await getViewer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const subscription = await request.json();
  const { error } = await supabase.from("push_subscriptions").upsert({
    user_id: user.id,
    subscription,
    active: true,
    archived: false,
  }, { onConflict: "user_id" });
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true });
}
