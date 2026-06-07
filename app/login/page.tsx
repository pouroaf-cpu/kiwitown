"use client";

import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Channel = "phone" | "email";

// Best-effort NZ → E.164. Users may type 021…, 6421…, or +6421….
function toE164NZ(raw: string): string {
  const t = raw.replace(/[\s()-]/g, "");
  if (t.startsWith("+")) return t;
  if (t.startsWith("0")) return "+64" + t.slice(1);
  if (t.startsWith("64")) return "+" + t;
  return t;
}

export default function LoginPage() {
  const supabase = useMemo(() => createClient(), []);
  const [channel, setChannel] = useState<Channel>("phone");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function reset() {
    setError("");
    setMessage("");
  }
  function switchChannel(next: Channel) {
    setChannel(next);
    setOtpSent(false);
    setOtp("");
    reset();
  }

  async function handleEmail() {
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (authError) return setError(authError.message);
    window.location.assign("/");
  }

  async function handlePhone() {
    const cleanPhone = toE164NZ(phone);
    if (!otpSent) {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Could not send code.");
      setOtpSent(true);
      return setMessage(`We texted a 6-digit code to ${cleanPhone}.`);
    }
    const res = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: cleanPhone, code: otp.trim() }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "That code is incorrect or expired.");
    window.location.assign("/");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    reset();
    try {
      if (channel === "phone") await handlePhone();
      else await handleEmail();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  const submitLabel = loading
    ? "Working..."
    : channel === "phone"
      ? otpSent
        ? "Verify & continue"
        : "Text me a code"
      : "Sign in";

  return (
    <main className="industrial-grid min-h-screen px-5 py-8 md:flex md:items-center md:justify-center">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-between gap-10 md:min-h-0 md:flex-row md:items-center">
        <section className="pt-10 md:max-w-xl md:pt-0">
          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-brand/30 bg-brand/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand">
            <span className="h-2 w-2 rounded-full bg-brand shadow-brand" />
            Kiwitown Electrical
          </div>
          <h1 className="font-display text-5xl uppercase leading-[0.92] text-white md:text-7xl">
            Crew performance.
            <span className="block text-brand">Visible daily.</span>
          </h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-text-secondary md:text-base">
            KPI tracking, weekly checks and month-end bonus reconciliation built for the field.
          </p>
        </section>

        <section className="panel relative w-full overflow-hidden p-6 md:max-w-md md:p-8">
          <div className="absolute right-0 top-0 h-24 w-24 border-b border-l border-brand/25 bg-brand/5" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand">Secure access</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Sign in</h2>
          <p className="mt-2 text-sm text-text-secondary">
            {channel === "phone"
              ? "Enter your mobile number and we'll text you a one-time code. Accounts are set up by an admin."
              : "Office/owner accounts: sign in with your email and password."}
          </p>

          {/* Channel: phone / email */}
          <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-black/20 p-1">
            <button
              type="button"
              onClick={() => switchChannel("phone")}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${channel === "phone" ? "bg-brand text-background" : "text-text-secondary hover:text-white"}`}
            >
              Phone
            </button>
            <button
              type="button"
              onClick={() => switchChannel("email")}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${channel === "email" ? "bg-brand text-background" : "text-text-secondary hover:text-white"}`}
            >
              Email
            </button>
          </div>

          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            {channel === "phone" && !otpSent && (
              <label className="block text-xs font-semibold uppercase tracking-widest text-text-secondary">
                Mobile number
                <input
                  className="field mt-3"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="+64 21 123 4567"
                  required
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </label>
            )}

            {channel === "phone" && otpSent && (
              <label className="block text-xs font-semibold uppercase tracking-widest text-text-secondary">
                Code
                <input
                  className="field mt-3 tracking-[0.4em]"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  required
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    reset();
                  }}
                  className="mt-3 text-xs font-semibold normal-case tracking-normal text-brand"
                >
                  Use a different number
                </button>
              </label>
            )}

            {channel === "email" && (
              <>
                <label className="block text-xs font-semibold uppercase tracking-widest text-text-secondary">
                  Email address
                  <input
                    className="field mt-3"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="name@kiwitown.co.nz"
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>
                <label className="block text-xs font-semibold uppercase tracking-widest text-text-secondary">
                  Password
                  <input
                    className="field mt-3"
                    autoComplete="current-password"
                    required
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </label>
              </>
            )}

            <button className="primary-button" disabled={loading} type="submit">
              {submitLabel}
            </button>
          </form>

          {message && <p className="mt-5 rounded-xl border border-brand/25 bg-brand/10 p-3 text-sm text-brand">{message}</p>}
          {error && <p className="mt-5 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        </section>
      </div>
    </main>
  );
}
