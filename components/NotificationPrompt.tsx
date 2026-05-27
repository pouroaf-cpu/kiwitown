"use client";

import { useState } from "react";

function keyToBytes(key: string) {
  const padding = "=".repeat((4 - (key.length % 4)) % 4);
  const base64 = (key + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(window.atob(base64), (character) => character.charCodeAt(0));
}

export default function NotificationPrompt() {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const [state, setState] = useState<"idle" | "saving" | "enabled" | "error">("idle");
  if (!key || typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const vapidPublicKey = key;

  async function enable() {
    setState("saving");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Notifications not allowed");
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(vapidPublicKey) });
      const response = await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription) });
      if (!response.ok) throw new Error("Subscription not saved");
      setState("enabled");
    } catch {
      setState("error");
    }
  }

  return (
    <button className="secondary-button mt-4 !py-2.5 text-xs" onClick={enable} disabled={state === "saving" || state === "enabled"}>
      {state === "enabled" ? "Daily updates enabled" : state === "saving" ? "Enabling..." : state === "error" ? "Retry push alerts" : "Enable KPI push alerts"}
    </button>
  );
}
