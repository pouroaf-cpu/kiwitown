"use client";

import { useState } from "react";
import Link from "next/link";

export default function FeedbackPage() {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    if (!message.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send.");
      setSent(true);
      setMessage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen industrial-grid">
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-5 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Wellbeing</p>
        <h1 className="mt-3 font-display text-4xl uppercase text-white md:text-5xl">Anonymous feedback</h1>

        {sent ? (
          <div className="mt-8 panel p-6">
            <p className="text-lg font-semibold text-white">Sent — thank you.</p>
            <p className="mt-2 text-sm text-text-secondary">
              This message was not linked to you. No name, role or account was stored with it.
            </p>
            <div className="mt-6 flex gap-3">
              <button className="secondary-button !w-auto" onClick={() => setSent(false)}>Send another</button>
              <Link href="/" className="primary-button !w-auto">Done</Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 panel p-6">
            <p className="text-sm text-text-secondary">
              Say anything you like — how you&apos;re feeling, something that isn&apos;t working, an idea. It&apos;s sent to the
              owner with <span className="text-white">no name, role or account attached</span>, so it can&apos;t be traced back to you.
            </p>
            <textarea
              className="field mt-4 min-h-40 resize-y"
              placeholder="Write your message…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={4000}
            />
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            <div className="mt-5 flex items-center justify-between gap-3">
              <Link href="/" className="text-sm text-text-secondary hover:text-white">Cancel</Link>
              <button className="primary-button !w-auto" onClick={send} disabled={sending || !message.trim()}>
                {sending ? "Sending…" : "Send anonymously"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
