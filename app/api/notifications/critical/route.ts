export const preferredRegion = "syd1";

import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CheckInputType, DailyValue } from "@/lib/types";

function answered(input: CheckInputType, v: DailyValue | undefined): boolean {
  if (input === "yes_no") return v === true;
  if (input === "number" || input === "currency") return typeof v === "number";
  return typeof v === "string" && v !== "";
}

// Cron: push-notify the alert role (COO / Ops) when a critical DAILY check is
// past its due time and someone in the owning role hasn't done it. One alert per
// check per day (deduped via check_alerts). Vercel injects the CRON_SECRET.
async function run(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!vapidPublic || !vapidPrivate || !subject)
    return NextResponse.json({ error: "VAPID environment is incomplete" }, { status: 500 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    return NextResponse.json({ disabled: "SUPABASE_SERVICE_ROLE_KEY not configured" });
  webpush.setVapidDetails(subject, vapidPublic, vapidPrivate);

  const admin = createAdminClient();
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Auckland" }).format(now);
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
    const payload = JSON.stringify({
      title: "Critical check overdue",
      body: `"${it.label}" not done by ${String(it.due_time).slice(0, 5)} — ${names}.`,
      url: "/",
    });

    // recipients = people in the alert role with an active push subscription
    const { data: recipients } = await admin.from("profiles").select("user_id").eq("role", it.alert_role || "coo").eq("active", true).eq("archived", false);
    const userIds = (recipients ?? []).map((r) => r.user_id).filter(Boolean);
    let pushed = 0;
    if (userIds.length) {
      const { data: pushSubs } = await admin.from("push_subscriptions").select("subscription").in("user_id", userIds).eq("active", true).eq("archived", false);
      for (const s of pushSubs ?? []) {
        try {
          await webpush.sendNotification(s.subscription as Parameters<typeof webpush.sendNotification>[0], payload);
          pushed++;
        } catch {
          /* expired/invalid subscription — skip */
        }
      }
    }
    await admin.from("check_alerts").insert({ check_item_id: it.id, period_date: today });
    alerts.push(`${it.label}: ${overdue.length} overdue, ${pushed} pushed`);
  }

  return NextResponse.json({ ran: today, time: hm, alerts });
}

export const GET = run;
export const POST = run;
