export const preferredRegion = "syd1";

import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkVerification } from "@/lib/verify";
import { toE164NZ } from "@/lib/phone";

function throwawayPassword(): string {
  return randomBytes(24).toString("base64url");
}

// Step 2 of phone login: check the OTP with Twilio Verify, then mint a Supabase
// session. We rotate a throwaway password and sign in through the SSR client so
// the session cookie is set on the response — the user never sees a password.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { phone?: string; code?: string };
  if (!body.phone?.trim() || !body.code?.trim()) {
    return NextResponse.json({ error: "Phone and code are required." }, { status: 400 });
  }
  const phone = toE164NZ(body.phone.trim());

  let approved = false;
  try {
    approved = await checkVerification(phone, body.code.trim());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Verification failed." }, { status: 502 });
  }
  if (!approved) {
    return NextResponse.json({ error: "That code is incorrect or has expired." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: prof } = await admin
    .from("profiles")
    .select("user_id, active, archived")
    .eq("phone", phone)
    .maybeSingle();
  if (!prof || !prof.active || prof.archived) {
    return NextResponse.json({ error: "No active account for that number." }, { status: 403 });
  }

  // Mint the session via an internal email derived from the phone, so we never
  // depend on Supabase's Phone provider being enabled (email auth is always on).
  // The user still signs in with phone + Twilio Verify; this email is internal.
  const password = throwawayPassword();
  const email = `${phone.replace(/\D/g, "")}@phone.kiwitown.app`;
  const { error: updateError } = await admin.auth.admin.updateUserById(prof.user_id, {
    email,
    email_confirm: true,
    password,
  });
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) return NextResponse.json({ error: signInError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
