"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SettingsSheet from "@/components/SettingsSheet";

type Me = {
  id: string;
  name: string;
  nickname: string | null;
  avatar_url: string | null;
  phone: string;
  email: string;
  role: string | null;
};

// Self-service profile editor — opens in the same full-screen format as the
// Task Editor. Photo, display name, nickname and password. Reachable from the
// sidebar avatar (all roles) and the Settings menu (admin roles). When `initial`
// is supplied (from server-rendered data) it seeds immediately; otherwise it
// loads /api/me.
export default function ProfileEditor({ onClose, onSaved, initial }: { onClose: () => void; onSaved?: () => void; initial?: Me }) {
  const supabase = useMemo(() => createClient(), []);
  const [me, setMe] = useState<Me | null>(initial ?? null);
  const [name, setName] = useState(initial?.name ?? "");
  const [nickname, setNickname] = useState(initial?.nickname ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial?.avatar_url ?? null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initial) return;
    fetch("/api/me")
      .then((r) => { if (!r.ok) throw new Error("load"); return r.json(); })
      .then((d: Me) => {
        setMe(d);
        setName(d.name || "");
        setNickname(d.nickname || "");
        setAvatarUrl(d.avatar_url || null);
      })
      .catch(() => setLoadError(true));
  }, [initial]);

  async function uploadAvatar(file: File) {
    if (!me) return;
    setUploading(true);
    setNotice("");
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `avatars/${me.id}.${ext}`;
      const { error } = await supabase.storage.from("check-photos").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("check-photos").getPublicUrl(path);
      setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`); // cache-bust so the new image shows
    } catch {
      setNotice("Photo upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (password && password !== confirm) return setNotice("Passwords don't match.");
    if (password && password.length < 8) return setNotice("Password must be at least 8 characters.");
    setSaving(true);
    setNotice("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, nickname, avatar_url: avatarUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save.");
      if (password) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw new Error(error.message);
      }
      onSaved?.();
      onClose();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  const avatarLetter = (nickname || name || "?").trim().slice(0, 1).toUpperCase();

  return (
    <SettingsSheet title="Profile" onClose={onClose} onSave={me ? save : undefined} saving={saving || uploading}>
      {loadError ? (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">Couldn&apos;t load your profile. Please try again.</p>
          <button type="button" className="primary-button !w-auto" onClick={() => window.location.reload()}>Reload</button>
        </div>
      ) : !me ? (
        <p className="text-sm text-text-secondary">Loading…</p>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-3">
            <div className="h-24 w-24 overflow-hidden rounded-full border border-border bg-surface">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-text-secondary">{avatarLetter}</div>
              )}
            </div>
            <button type="button" className="secondary-button !w-auto" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? "Uploading…" : avatarUrl ? "Change photo" : "Add photo"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadAvatar(f);
              }}
            />
          </div>

          <label className="block text-xs uppercase tracking-widest text-text-secondary">
            Name
            <input className="field mt-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
          </label>
          <label className="block text-xs uppercase tracking-widest text-text-secondary">
            Nickname (optional)
            <input className="field mt-2" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="What we call you" />
          </label>
          <div className="rounded-xl border border-border bg-surface px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-text-secondary">Sign-in</p>
            <p className="mt-1 text-sm text-white">{me.phone || me.email || "—"}</p>
            <p className="text-xs text-text-secondary">Your username can&apos;t be changed here.</p>
          </div>

          <div className="border-t border-border pt-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">Change password</p>
            <label className="mt-3 block text-xs uppercase tracking-widest text-text-secondary">
              New password
              <input className="field mt-2" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep current" />
            </label>
            <label className="mt-3 block text-xs uppercase tracking-widest text-text-secondary">
              Confirm new password
              <input className="field mt-2" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </label>
          </div>

          {notice && <p className="text-sm text-red-300">{notice}</p>}
        </div>
      )}
    </SettingsSheet>
  );
}
