import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function calcScore(
  charge_out: number,
  job_cards: number,
  callbacks: number,
  timesheets_days: number
): number {
  const s1 = Math.min((charge_out / 85) * 100, 100);
  const s2 = Math.min((job_cards / 20) * 100, 100);
  const s3 = Math.max(0, (1 - callbacks / 5) * 100);
  const s4 = Math.min((timesheets_days / 10) * 100, 100);
  return parseFloat(((s1 + s2 + s3 + s4) / 4).toFixed(2));
}

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!adminProfile || adminProfile.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can enter KPI data" },
      { status: 403 }
    );
  }

  let body: {
    sparky_id: string;
    month: number;
    year: number;
    charge_out: number;
    job_cards: number;
    callbacks: number;
    timesheets_days: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { sparky_id, month, year, charge_out, job_cards, callbacks, timesheets_days } = body;

  const { data: sparkyProfile } = await supabase
    .from("profiles")
    .select("salary, bonus_pct")
    .eq("id", sparky_id)
    .single();

  if (!sparkyProfile) {
    return NextResponse.json({ error: "Sparky not found" }, { status: 404 });
  }

  const score = calcScore(charge_out, job_cards, callbacks, timesheets_days);
  const bonus_earned = parseFloat(
    (
      (score / 100) *
      (sparkyProfile.salary / 12) *
      (sparkyProfile.bonus_pct / 100)
    ).toFixed(2)
  );

  const { error } = await supabase.from("kpi_entries").upsert(
    {
      sparky_id,
      month,
      year,
      charge_out,
      job_cards,
      callbacks,
      timesheets_days,
      score,
      bonus_earned,
    },
    { onConflict: "sparky_id,month,year" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, score, bonus_earned });
}

export async function GET(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const url = new URL(req.url);
  const month = parseInt(url.searchParams.get("month") || String(new Date().getMonth() + 1));
  const year = parseInt(url.searchParams.get("year") || String(new Date().getFullYear()));

  if (profile.role === "sparky") {
    const { data, error } = await supabase
      .from("kpi_entries")
      .select("*")
      .eq("sparky_id", profile.id)
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .limit(12);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (profile.role === "admin") {
    const { data, error } = await supabase
      .from("kpi_entries")
      .select("*")
      .eq("month", month)
      .eq("year", year);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
