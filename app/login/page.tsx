"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Step = "email" | "otp";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) {
      setError(error.message);
    } else {
      setStep("otp");
    }
    setLoading(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    if (error) {
      setError(error.message);
    } else {
      window.location.href = "/";
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      {/* Logo / Brand */}
      <div className="mb-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center mx-auto mb-4">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16 4L28 10V22L16 28L4 22V10L16 4Z"
              fill="white"
              opacity="0.9"
            />
            <path
              d="M12 16L15 19L20 13"
              stroke="#0B0D12"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Kiwitown Electrical
        </h1>
        <p className="text-text-secondary text-sm mt-1">Field management</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-6">
        {step === "email" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Email address
              </label>
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
              <p className="text-xs text-muted mt-2">
                We&apos;ll send you a 6-digit sign-in code
              </p>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-brand text-white font-semibold py-3 rounded-xl disabled:opacity-50 active:scale-95 transition-transform"
            >
              {loading ? "Sending…" : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <button
                type="button"
                onClick={() => { setStep("email"); setError(""); setOtp(""); }}
                className="flex items-center gap-1 text-sm text-text-secondary mb-4 active:opacity-70"
              >
                ← Change email
              </button>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Enter the 6-digit code sent to {email}
              </label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                placeholder="000000"
                required
                autoFocus
                className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text-primary text-2xl tracking-widest text-center placeholder:text-muted focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-brand text-white font-semibold py-3 rounded-xl disabled:opacity-50 active:scale-95 transition-transform"
            >
              {loading ? "Verifying…" : "Verify & sign in"}
            </button>

            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full text-sm text-text-secondary py-2 active:opacity-70"
            >
              Resend code
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
