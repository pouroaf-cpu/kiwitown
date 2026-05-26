"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      window.location.href = "/";
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      {/* Logo / Brand */}
      <div className="mb-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" fill="white" opacity="0.9" />
            <path d="M12 16L15 19L20 13" stroke="#0B0D12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Kiwitown Electrical</h1>
        <p className="text-text-secondary text-sm mt-1">Field management</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-6">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
              autoComplete="email"
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text-primary text-base placeholder:text-muted focus:outline-none focus:border-brand transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text-primary text-base placeholder:text-muted focus:outline-none focus:border-brand transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-brand text-white font-semibold py-3 rounded-xl disabled:opacity-50 active:scale-95 transition-transform"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-xs text-text-muted text-center mt-5">
          Contact your admin to get access
        </p>
      </div>
    </div>
  );
}
