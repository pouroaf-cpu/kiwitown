export const preferredRegion = "syd1";

import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getViewer, hasRole } from "@/lib/authorization";
import { createAdminClient } from "@/lib/supabase/admin";
import { toE164NZ } from "@/lib/phone";
import type { UserRole } from "@/lib/types";

function tempPassword(): string {
  // 8 chars, no ambiguous 0/O/1/I/l.
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from(randomBytes(8), (b) => alphabet[b % alphabet.length]).join("");
}

const roles: (UserRole | null)[] = ["super_admin", "coo", "office_admin", "foreman", "sparky", null];

export async function GET() {
  const { supabase, user, profile } = await getViewer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(profile, ["coo", "super_admin", "office_admin"])) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data, error } = await supabase.from("profiles").select("*").eq("archived", false).order("created_at");
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const { supabase, user, profile } = await getViewer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(profile, ["coo", "super_admin", "office_admin"])) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

// Provision a new login: COO/super_admin create a phone-as-username account with
// a one-time temp password, texted to the user, who must reset it on first login.
export async function POST(request: Request) {
  const { user, profile } = await getViewer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(profile, ["coo", "super_admin", "office_admin"])) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json()) as { name?: string; phone?: string; role?: UserRole };
  const name = body.name?.trim();
  const role = body.role;
  if (!name || !body.phone?.trim() || !role) {
    return NextResponse.json({ error: "Name, phone and role are required" }, { status: 400 });
  }
  if (!["super_admin", "coo", "office_admin", "foreman", "sparky"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  if (role === "super_admin" && profile?.role !== "super_admin") {
    return NextResponse.json({ error: "Only a system owner can create owner accounts" }, { status: 403 });
  }
  const phone = toE164NZ(body.phone.trim());
  const admin = createAdminClient();

  // Phone is the username. No welcome SMS / temp password — login is a Twilio
  // Verify OTP that mints the session (see /api/auth/otp/*). A random internal
  // password keeps the account valid; it is never used directly.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    phone,
    password: tempPassword(),
    phone_confirm: true,
    user_metadata: { name },
  });
  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message ?? "Could not create account" }, { status: 400 });
  }

  // handle_new_user() created the profile row on insert; set the role.
  const { data: prof, error: profileError } = await admin
    .from("profiles")
    .update({ role, name, phone, active: true, archived: false })
    .eq("user_id", created.user.id)
    .select()
    .single();
  if (profileError) {
    return NextResponse.json({ error: `Account created but profile setup failed: ${profileError.message}` }, { status: 500 });
  }

  return NextResponse.json({ profile: prof });
}
