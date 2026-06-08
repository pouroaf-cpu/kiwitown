export const preferredRegion = "syd1";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSms, smsConfigured } from "@/lib/sms";
import { toE164NZ } from "@/lib/phone";
import type { CheckInputType, DailyValue } from "@/lib/types";

function answered(input: CheckInputType, v: DailyValue | undefined): boolean {
  if (input === "yes_no") return v === true;
  if (input === "number" || input === "currency") return typeof v === "number";
  return typeof v === "string" && v !== "";
}

// Cron: text the alert role (COO / Ops) when a critical DAILY check is past its
// due time and someone in the owning role hasn't done it. One text per check
// per day (deduped via check_alerts). Vercel injects the CRON_SECRET bearer.
async function run(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    return NextResponse.json({ disabled: "SUPABASE_SERVICE_ROLE_KEY not configured" });

  const admin = createAdminClient();
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Auckland" }).format(now); // yyyy-mm-dd
  const hm = new Intl.DateTimeFormat("en-GB", { timeZone: "Pacific/Auckland", hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
  const nowMin = Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));

  const { data: items } = await admin
    .from("check_items")
    .select("*")
    .eq("active", true).eq("archived", false).eq("draft", false)
    .eq("critical", true).eq("cadence", "daily")
    .not("due_time", "is", null);

  const dueNow = (items ?? []).filter((it) => {
    const [h, m] = String(it.due_time).split(":").map(Number);
    return Number.isFinite(h) && nowMin >= h * 60 + m;
  });

  const alerts: string[] = [];
  for (const it of dueNow) {
    const { data: already } = await admin.from("check_alerts").select("id").eq("check_item_id", it.id).eq("period_date", today).maybeSingle();
    if (already) continue;

    const { data: people } = await admin.from("profiles").select("id, name").eq("role", it.role).eq("active", true).eq("archived", false);
    if (!people?.length) continue;
    const ids = people.map((p) => p.id);
    const { data: subs } = await admin.from("daily_checks").select("profile_id, values").eq("cadence", "daily").eq("check_date", today).in("profile_id", ids);
    const byPerson = new Map((subs ?? []).map((s) => [s.profile_id, s.values as Record<string, DailyValue>]));

    const overdue = people.filter((p) => !answered(it.input_type, byPerson.get(p.id)?.[it.id]));
    if (!overdue.length) continue;

    const names = overdue.map((p) => p.name || "someone").join(", ");
    const body = `Kiwitown alert: "${it.label}" not done by ${String(it.due_time).slice(0, 5)} — ${names}.`;
    const { data: recipients } = await admin.from("profiles").select("phone").eq("role", it.alert_role || "coo").eq("active", true).eq("archived", false);

    let sent = 0;
    if (smsConfigured()) {
      for (const r of recipients ?? []) {
        if (!r.phone) continue;
        try { await sendSms(toE164NZ(r.phone), body); sent++; } catch { /* keep going */ }
      }
    }
    await admin.from("check_alerts").insert({ check_item_id: it.id, period_date: today });
    alerts.push(`${it.label}: ${overdue.length} overdue, ${sent} texted`);
  }

  return NextResponse.json({ ran: today, time: hm, alerts, smsConfigured: smsConfigured() });
}

export const GET = run;
export const POST = run;
