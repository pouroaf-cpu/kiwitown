"use client";

import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function toNzMobile(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("64")) return `+${digits}`;
  if (digits.startsWith("0")) return `+64${digits.slice(1)}`;
  return `+64${digits}`;
}

export default function LoginPage() {
  const supabase = useMemo(() => createClient(), []);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function requestCode(event: FormEvent) {
    event.preventDefault();
    const normalised = toNzMobile(phone);
    setLoading(true);
    setError("");
    const { error: requestError } = await supabase.auth.signInWithOtp({ phone: normalised });
    setLoading(false);
    if (requestError) {
      setError(requestError.message);
      return;
    }
    setSentTo(normalised);
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: sentTo,
      token: otp.trim(),
      type: "sms",
    });
    setLoading(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    window.location.assign("/");
  }

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
          <h2 className="mt-3 text-2xl font-semibold text-white">
            {sentTo ? "Verify your code" : "Sign in by mobile"}
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            {sentTo ? `Six-digit code sent to ${sentTo}.` : "Use your registered NZ mobile number."}
          </p>
          {!sentTo ? (
            <form className="mt-8 space-y-5" onSubmit={requestCode}>
              <label className="block text-xs font-semibold uppercase tracking-widest text-text-secondary">
                Mobile number
                <input
                  className="field mt-3"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="021 234 5678"
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </label>
              <button className="primary-button" disabled={loading} type="submit">
                {loading ? "Sending code..." : "Send access code"}
              </button>
            </form>
          ) : (
            <form className="mt-8 space-y-5" onSubmit={verifyCode}>
              <label className="block text-xs font-semibold uppercase tracking-widest text-text-secondary">
                One-time code
                <input
                  className="field mt-3 text-center text-2xl tracking-[0.45em]"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  required
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                />
              </label>
              <button className="primary-button" disabled={loading || otp.length !== 6} type="submit">
                {loading ? "Checking..." : "Verify and continue"}
              </button>
              <button className="secondary-button" onClick={() => setSentTo("")} type="button">
                Use another number
              </button>
            </form>
          )}
          {error && <p className="mt-5 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        </section>
      </div>
    </main>
  );
}
