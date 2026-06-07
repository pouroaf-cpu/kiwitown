export const preferredRegion = "syd1";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendVerification, verifyConfigured } from "@/lib/verify";
import { toE164NZ } from "@/lib/phone";

// Step 1 of phone login: send a Twilio Verify OTP to a registered, active number.
export async function POST(request: Request) {
  if (!verifyConfigured()) {
    return NextResponse.json({ error: "Phone login is not configured." }, { status: 503 });
  }
  const body = (await request.json().catch(() => ({}))) as { phone?: string };
  if (!body.phone?.trim()) {
    return NextResponse.json({ error: "Enter your mobile number." }, { status: 400 });
  }
  const phone = toE164NZ(body.phone.trim());

  // Only text a code to a real, active account (internal app — a clear error is fine).
  const admin = createAdminClient();
  const { data: prof } = await admin
    .from("profiles")
    .select("active, archived")
    .eq("phone", phone)
    .maybeSingle();
  if (!prof || !prof.active || prof.archived) {
    return NextResponse.json(
      { error: "No active account for that number. Ask an admin to set you up." },
      { status: 404 }
    );
  }

  try {
    await sendVerification(phone);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not send code." }, { status: 502 });
  }
}
