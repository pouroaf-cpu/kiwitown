export const preferredRegion = "syd1";

import { NextResponse } from "next/server";
import { getViewer } from "@/lib/authorization";

// Anonymous feedback submission. Requires a signed-in session (so it can't be
// spammed by the public) but stores ONLY the message + timestamp — no profile,
// user id or role is written, so the row is not linked to the sender.
export async function POST(request: Request) {
  const { supabase, user } = await getViewer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { message?: string };
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 4000) : "";
  if (!message) return NextResponse.json({ error: "Please write a message first." }, { status: 400 });

  const { error } = await supabase.from("anonymous_feedback").insert({ message });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
