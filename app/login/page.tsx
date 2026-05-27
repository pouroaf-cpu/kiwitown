"use client";

import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    setLoading(true);
    setError("");
    setMessage("");

    const { data, error: authError } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email: cleanEmail, password })
        : await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: { name: name.trim() },
              emailRedirectTo: `${window.location.origin}/auth/confirm?next=/`,
            },
          });

    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }

    if (mode === "signup" && !data.session) {
      setMessage("Account created. Check your email to confirm access, then sign in.");
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
            {mode === "signin" ? "Sign in by email" : "Create your account"}
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            {mode === "signin"
              ? "Use your registered email address and password."
              : "Register with email. Daniel or a super admin assigns your role after first login."}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-black/20 p-1">
            <button
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${mode === "signin" ? "bg-brand text-background" : "text-text-secondary hover:text-white"}`}
              onClick={() => {
                setMode("signin");
                setError("");
                setMessage("");
              }}
              type="button"
            >
              Sign in
            </button>
            <button
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${mode === "signup" ? "bg-brand text-background" : "text-text-secondary hover:text-white"}`}
              onClick={() => {
                setMode("signup");
                setError("");
                setMessage("");
              }}
              type="button"
            >
              Register
            </button>
          </div>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <label className="block text-xs font-semibold uppercase tracking-widest text-text-secondary">
                Full name
                <input
                  className="field mt-3"
                  autoComplete="name"
                  placeholder="Daniel Frew"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
            )}
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
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                minLength={8}
                placeholder="Minimum 8 characters"
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <button className="primary-button" disabled={loading} type="submit">
              {loading ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
          {message && <p className="mt-5 rounded-xl border border-brand/25 bg-brand/10 p-3 text-sm text-brand">{message}</p>}
          {error && <p className="mt-5 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        </section>
      </div>
    </main>
  );
}
