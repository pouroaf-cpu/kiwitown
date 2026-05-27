export const preferredRegion = "syd1";

import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

async function runNotifications(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!vapidPublic || !vapidPrivate || !subject) return NextResponse.json({ error: "VAPID environment is incomplete" }, { status: 500 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ delivered: 0, disabled: "SUPABASE_SERVICE_ROLE_KEY is not configured" });
  }
  webpush.setVapidDetails(subject, vapidPublic, vapidPrivate);
  const admin = createAdminClient();
  const now = new Date();
  const nzParts = Object.fromEntries(new Intl.DateTimeFormat("en-NZ", {
    timeZone: "Pacific/Auckland", year: "numeric", month: "numeric", day: "numeric", weekday: "short",
  }).formatToParts(now).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  const month = Number(nzParts.month);
  const year = Number(nzParts.year);
  const isMonday = nzParts.weekday === "Mon";
  const isMidMonth = Number(nzParts.day) === 15;
  const { data: subscriptions, error } = await admin.from("push_subscriptions").select("subscription,user_id").eq("active", true).eq("archived", false);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: profiles } = await admin.from("profiles").select("user_id,id").eq("role", "sparky").eq("active", true).eq("archived", false);
  const profileByUser = new Map((profiles ?? []).map((profile) => [profile.user_id, profile.id]));
  let delivered = 0;
  for (const row of subscriptions ?? []) {
    const sparkyId = profileByUser.get(row.user_id);
    if (!sparkyId) continue;
    const { data: entry } = await admin.from("kpi_entries").select("score,bonus_earned").eq("sparky_id", sparkyId).eq("month", month).eq("year", year).eq("archived", false).maybeSingle();
    const messages = [{ type: "daily_kpi", title: "Kiwitown KPI update", body: entry ? `Current score ${entry.score}/100 | Bonus $${Number(entry.bonus_earned).toFixed(0)}` : "Your monthly KPI entry is waiting for update." }];
    if (isMonday) messages.push({ type: "weekly_summary", title: "Weekly KPI summary", body: entry ? `Start the week at ${entry.score}/100.` : "New week started. KPI updates will appear here." });
    if (isMidMonth && entry && Number(entry.score) < 70) messages.push({ type: "midmonth_alert", title: "Target alert", body: `Your score is ${entry.score}/100 at mid-month. Check your KPI detail.` });
    for (const message of messages) {
      await webpush.sendNotification(row.subscription as webpush.PushSubscription, JSON.stringify({ title: message.title, body: message.body, url: "/sparky" }));
      await admin.from("notification_jobs").insert({ notification_type: message.type, scheduled_for: now.toISOString(), payload: { user_id: row.user_id }, sent_at: now.toISOString() });
      delivered += 1;
    }
  }
  return NextResponse.json({ delivered });
}

export async function GET(request: Request) {
  return runNotifications(request);
}

export async function POST(request: Request) {
  return runNotifications(request);
}
