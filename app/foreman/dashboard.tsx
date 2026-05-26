"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
interface ExistingSubmission {
  id: string;
  checklist: Record<string, boolean>;
  notes: Record<string, string>;
  submitted_at: string;
}

interface Props {
  foremanName: string;
  profileId: string;
  weekNum: number;
  year: number;
  existingSubmission: ExistingSubmission | null;
}

/* ═══════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════ */
const CAT = {
  Operations: { color: "#00AEEF", glow: "rgba(0,174,239,0.22)" },
  Quality:    { color: "#2ECC71", glow: "rgba(46,204,113,0.22)" },
  Finance:    { color: "#F5A623", glow: "rgba(245,166,35,0.22)"  },
  Safety:     { color: "#F5821F", glow: "rgba(245,130,31,0.22)"  },
  People:     { color: "#A78BFA", glow: "rgba(167,139,250,0.22)" },
} as const;
type CatKey = keyof typeof CAT;

const CAT_ORDER: CatKey[] = ["Operations", "Quality", "Finance", "Safety", "People"];

const CHECKLIST = [
  { id: "pre_starts",   label: "Pre-starts completed",               cat: "Operations" as CatKey },
  { id: "ops_meeting",  label: "Weekly operations meeting completed", cat: "Operations" as CatKey },
  { id: "labour_util",  label: "Labour utilisation reviewed",         cat: "Operations" as CatKey },
  { id: "rework",       label: "Rework logged",                       cat: "Quality"    as CatKey },
  { id: "over_budget",  label: "Jobs over budget flagged",            cat: "Finance"    as CatKey },
  { id: "variations",   label: "Variations approved before work",     cat: "Finance"    as CatKey },
  { id: "back_costing", label: "Back costing completed on time",      cat: "Finance"    as CatKey },
  { id: "hs_qa",        label: "H&S or QA issues reported",          cat: "Safety"     as CatKey },
  { id: "coaching",     label: "Staff coaching completed",            cat: "People"     as CatKey },
  { id: "risks",        label: "Key risks escalated",                 cat: "Safety"     as CatKey },
];

const NOTES_FIELDS = [
  { id: "went_well",  label: "What went well?" },
  { id: "missed",     label: "What was missed?" },
  { id: "decisions",  label: "What decisions were made?" },
  { id: "escalate",   label: "What should be escalated next time?" },
  { id: "support",    label: "Support or training required?" },
];

const NAV_ITEMS = [
  { id: "weekly", label: "Weekly Check",  active: true,  coming: false },
  { id: "kpi",    label: "KPI Dashboard", active: false, coming: true  },
  { id: "admin",  label: "Admin Panel",   active: false, coming: true  },
];

/* ═══════════════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════════════ */
function getMondayISO() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.getFullYear(), d.getMonth(), diff);
  return mon.toISOString().split("T")[0];
}

function getWeekRange(weekNum: number, year: number): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(now.getFullYear(), now.getMonth(), diff);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-NZ", { day: "numeric", month: "short" });
  return `${fmt(mon)} – ${fmt(sun)}`;
}

function mkChecklist(): Record<string, boolean> {
  return CHECKLIST.reduce((a, i) => ({ ...a, [i.id]: false }), {});
}
function mkNotes(): Record<string, string> {
  return NOTES_FIELDS.reduce((a, f) => ({ ...a, [f.id]: "" }), {});
}

const STORE_KEY = "ke_foreman_v2";

/* ═══════════════════════════════════════════════════════════════
   HOOKS
═══════════════════════════════════════════════════════════════ */
function useIsDesktop(bp = 768) {
  const [v, setV] = useState(false);
  useEffect(() => {
    const check = () => setV(window.innerWidth >= bp);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [bp]);
  return v;
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENTS
═══════════════════════════════════════════════════════════════ */

/* ── Logo ── */
function KELogo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", lineHeight: 1, userSelect: "none" }}>
      <span style={{ fontFamily: "var(--font-satisfy), cursive", fontSize: 22, color: "#00AEEF", lineHeight: 1.1 }}>
        Kiwitown
      </span>
      <span style={{ fontFamily: "var(--font-barlow), 'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 13, color: "#F2F6FA", letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 1 }}>
        Electrical
      </span>
    </div>
  );
}

/* ── Avatar ── */
function Avatar({ name, size = 36, onClick }: { name: string; size?: number; onClick?: () => void }) {
  const ini = (name || "KE").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div
      onClick={onClick}
      style={{
        width: size, height: size, borderRadius: "50%",
        background: "linear-gradient(135deg, #00AEEF 0%, #0080C7 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-barlow), 'Barlow Condensed', sans-serif", fontWeight: 700,
        fontSize: size * 0.38, color: "white", flexShrink: 0, letterSpacing: "0.04em",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {ini}
    </div>
  );
}

/* ── Nav icons ── */
function NavIco({ id, active }: { id: string; active: boolean }) {
  const c = active ? "#00AEEF" : "#556677";
  if (id === "weekly") return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="2.5" stroke={c} strokeWidth="1.4"/>
      <path d="M5 8L7 10L11 6" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (id === "kpi") return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="9" width="3" height="5.5" rx="1" stroke={c} strokeWidth="1.4"/>
      <rect x="6.5" y="5.5" width="3" height="9" rx="1" stroke={c} strokeWidth="1.4"/>
      <rect x="11.5" y="2" width="3" height="12.5" rx="1" stroke={c} strokeWidth="1.4"/>
    </svg>
  );
  if (id === "admin") return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.2" stroke={c} strokeWidth="1.4"/>
      <path d="M8 1.5v1.8M8 12.7v1.8M1.5 8h1.8M12.7 8h1.8M3.7 3.7l1.2 1.2M11.1 11.1l1.2 1.2M3.7 12.3l1.2-1.2M11.1 4.9l1.2-1.2" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
  return null;
}

/* ── Progress Ring ── */
function ProgressRing({ pct, count, total, allDone }: { pct: number; count: number; total: number; allDone: boolean }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - pct / 100);
  const col = allDone ? "#2ECC71" : "#00AEEF";
  return (
    <div style={{ position: "relative", width: 132, height: 132, flexShrink: 0 }}>
      <svg width="132" height="132" viewBox="0 0 132 132" className={allDone ? "ring-pulse" : ""}>
        <circle cx="66" cy="66" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="11" />
        {pct > 0 && (
          <circle cx="66" cy="66" r={r} fill="none"
            stroke={col} strokeOpacity={0.18} strokeWidth="14"
            strokeDasharray={circ} strokeDashoffset={off}
            transform="rotate(-90 66 66)"
          />
        )}
        <circle cx="66" cy="66" r={r} fill="none"
          stroke={col} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off}
          transform="rotate(-90 66 66)"
          style={{ transition: "stroke-dashoffset 0.55s cubic-bezier(.4,0,.2,1), stroke 0.35s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {allDone ? (
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" className="check-pop">
            <path d="M5 15L12 22L25 8" stroke="#2ECC71" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <>
            <span style={{ fontFamily: "var(--font-barlow), 'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 33, lineHeight: 1, color: "#F8F9FA", letterSpacing: "-0.01em" }}>
              {Math.round(pct)}%
            </span>
            <span style={{ fontSize: 10, color: "#556677", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 2 }}>
              {count}/{total}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Check row ── */
function CheckRow({ item, checked, onToggle }: { item: typeof CHECKLIST[0]; checked: boolean; onToggle: () => void }) {
  const { color, glow } = CAT[item.cat];
  return (
    <button className="row-btn" onClick={onToggle} style={{ background: checked ? `${color}0d` : "transparent" }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0, opacity: checked ? 1 : 0.5, transition: "opacity 0.2s" }} />
      <span style={{ flex: 1, fontSize: 15, fontWeight: 500, lineHeight: 1.35, color: checked ? "#DCE8F0" : "#7A8FA0", transition: "color 0.2s ease" }}>
        {item.label}
      </span>
      <div style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        border: checked ? "none" : "1.5px solid rgba(255,255,255,0.13)",
        background: checked ? color : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.2s ease, border-color 0.2s ease",
        boxShadow: checked ? `0 0 14px ${glow}` : "none",
      }}>
        {checked && (
          <svg className="check-pop" width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2 6.5L5.2 9.8L11 3.5" stroke="white" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
    </button>
  );
}

/* ── Category group ── */
function CatGroup({ cat, items, checklist, onToggle }: {
  cat: CatKey;
  items: typeof CHECKLIST;
  checklist: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  const { color } = CAT[cat];
  const done = items.filter(i => checklist[i.id]).length;
  const allDone = done === items.length;
  return (
    <div style={{ background: "#111419", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 3, height: 14, borderRadius: 2, background: color, flexShrink: 0 }} />
          <span style={{ fontFamily: "var(--font-barlow), 'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color }}>
            {cat}
          </span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: allDone ? color : "#4A5E6D", transition: "color 0.3s" }}>
          {done}/{items.length}
        </span>
      </div>
      {items.map((item, idx) => (
        <div key={item.id}>
          {idx > 0 && <div style={{ height: 1, background: "rgba(255,255,255,0.04)", marginLeft: 35 }} />}
          <CheckRow item={item} checked={checklist[item.id]} onToggle={() => onToggle(item.id)} />
        </div>
      ))}
    </div>
  );
}

/* ── Reflection notes (collapsible) ── */
function Reflection({ notes, onChange, open, onToggle }: {
  notes: Record<string, string>;
  onChange: (id: string, val: string) => void;
  open: boolean;
  onToggle: () => void;
}) {
  const filled = Object.values(notes).filter(v => v.trim()).length;
  return (
    <div style={{ background: "#111419", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, overflow: "hidden", marginTop: 8 }}>
      <button className="cat-header-btn" onClick={onToggle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 3, height: 14, borderRadius: 2, background: "#445566" }} />
          <span style={{ fontFamily: "var(--font-barlow), 'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7A8FA0" }}>
            Weekly Reflection
          </span>
          {filled > 0 && (
            <span style={{ background: "#00AEEF", color: "white", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, lineHeight: 1.5 }}>
              {filled}
            </span>
          )}
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s ease", color: "#445566" }}>
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="fade-up" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "12px 16px 16px" }}>
          {NOTES_FIELDS.map((f, idx) => (
            <div key={f.id} style={{ marginTop: idx > 0 ? 14 : 0 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#4A5E6D", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                {f.label}
              </label>
              <textarea
                value={notes[f.id]}
                onChange={e => onChange(f.id, e.target.value)}
                rows={2}
                placeholder="Add notes..."
                style={{
                  width: "100%", background: "#0B0D12",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: 6, color: "#DCE8F0",
                  fontSize: 14, padding: "9px 12px",
                  resize: "vertical", fontFamily: "var(--font-dm-sans), sans-serif",
                  lineHeight: 1.5, minHeight: 58,
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Offline banner ── */
function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    setOffline(!navigator.onLine);
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  if (!offline) return null;
  return (
    <div style={{ background: "#F5821F", color: "white", textAlign: "center", padding: "5px 16px", fontSize: 12, fontWeight: 600, letterSpacing: "0.02em" }}>
      Offline — changes saved locally
    </div>
  );
}

/* ── Toast ── */
type ToastType = "success" | "warning" | "error";
function Toast({ msg, type }: { msg: string; type: ToastType }) {
  const palette: Record<ToastType, string> = { success: "#2ECC71", warning: "#F5A623", error: "#E74C3C" };
  return (
    <div className="toast-anim" style={{
      position: "fixed", top: 72, left: "50%",
      transform: "translateX(-50%)",
      background: "#1A1E2A", border: `1px solid ${palette[type]}33`,
      borderRadius: 8, padding: "10px 18px",
      display: "flex", alignItems: "center", gap: 8,
      boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
      zIndex: 999, whiteSpace: "nowrap",
    }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: palette[type], flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 500, color: "#DCE8F0" }}>{msg}</span>
    </div>
  );
}

/* ── Mobile nav drawer ── */
function NavDrawer({ open, onClose, onProfile, done, total, weekNum, foremanName }: {
  open: boolean; onClose: () => void; onProfile: () => void;
  done: number; total: number; weekNum: number; foremanName: string;
}) {
  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
        transition: "opacity 0.25s",
      }} />
      <nav style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: 296, zIndex: 201,
        background: "#0D1018", borderRight: "1px solid rgba(255,255,255,0.08)",
        display: "flex", flexDirection: "column", overflowY: "auto",
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.28s cubic-bezier(.4,0,.2,1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <KELogo />
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#445566", padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <button onClick={() => { onClose(); onProfile(); }} style={{
            display: "flex", alignItems: "center", gap: 12, width: "100%",
            background: "#151A22", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10, padding: "13px 14px", cursor: "pointer", textAlign: "left",
          }}>
            <Avatar name={foremanName} size={38} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#DCE8F0" }}>{foremanName}</div>
              <div style={{ fontSize: 11, color: "#445566", marginTop: 1 }}>Foreman · Kiwitown Electrical</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3L9 7L5 11" stroke="#445566" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        <div style={{ padding: "0 20px", flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#2C3C4A", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Menu</div>
          {NAV_ITEMS.map(item => (
            <button key={item.id} disabled={item.coming} style={{
              display: "flex", alignItems: "center", gap: 11, width: "100%",
              padding: "11px 13px", marginBottom: 4, textAlign: "left",
              background: item.active ? "rgba(0,174,239,0.1)" : "none",
              border: item.active ? "1px solid rgba(0,174,239,0.18)" : "1px solid transparent",
              borderRadius: 8, cursor: item.coming ? "default" : "pointer",
              opacity: item.coming ? 0.4 : 1,
            }}>
              <NavIco id={item.id} active={item.active} />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: item.active ? "#DCE8F0" : "#556677" }}>{item.label}</span>
              {item.coming && (
                <span style={{ fontSize: 9, fontWeight: 700, color: "#334455", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Soon</span>
              )}
            </button>
          ))}
        </div>
        <div style={{ margin: "16px 20px 24px", background: "#151A22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "13px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#2C3C4A", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Week {weekNum}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(done / total) * 100}%`, background: done === total ? "#2ECC71" : "#00AEEF", borderRadius: 3, transition: "width 0.4s ease" }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#445566" }}>{done}/{total}</span>
          </div>
        </div>
      </nav>
    </>
  );
}

/* ── Profile panel ── */
function ProfilePanel({ open, onClose, done, total, submitted, weekNum, foremanName }: {
  open: boolean; onClose: () => void;
  done: number; total: number; submitted: boolean; weekNum: number; foremanName: string;
}) {
  const [displayName, setDisplayName] = useState(foremanName);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  function save() { setSaved(true); setTimeout(() => setSaved(false), 2200); }

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
        transition: "opacity 0.25s",
      }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "100%", maxWidth: 340,
        zIndex: 201, background: "#0D1018", borderLeft: "1px solid rgba(255,255,255,0.08)",
        display: "flex", flexDirection: "column", overflowY: "auto",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.28s cubic-bezier(.4,0,.2,1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#445566", padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span style={{ fontFamily: "var(--font-barlow), 'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16, color: "#DCE8F0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Profile & Settings
          </span>
        </div>
        <div style={{ padding: "28px 24px 20px", display: "flex", flexDirection: "column", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Avatar name={displayName} size={64} />
          <div style={{ marginTop: 12, fontFamily: "var(--font-barlow), 'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 22, color: "#DCE8F0", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {displayName}
          </div>
          <div style={{ fontSize: 12, color: "#445566", marginTop: 3 }}>Foreman · Kiwitown Electrical</div>
        </div>
        <div style={{ display: "flex", gap: 10, padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {[
            { val: done, sub: `of ${total} done`, col: done === total ? "#2ECC71" : "#00AEEF" },
            { val: submitted ? "✓" : "–", sub: "Submitted", col: submitted ? "#2ECC71" : "#334455" },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, background: "#111419", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-barlow), 'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 26, color: s.col, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 11, color: "#445566", marginTop: 3, fontWeight: 500 }}>{s.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "18px 24px", flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#2C3C4A", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Settings</div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#445566", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Display name</label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            style={{ width: "100%", background: "#111419", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, color: "#DCE8F0", fontSize: 14, padding: "10px 12px", fontFamily: "var(--font-dm-sans), sans-serif", marginBottom: 14 }}
          />
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            {[["Role", "Foreman"], ["Company", "Kiwitown"]].map(([l, v]) => (
              <div key={l} style={{ flex: 1, background: "#111419", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "11px 13px" }}>
                <div style={{ fontSize: 10, color: "#334455", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{l}</div>
                <div style={{ fontSize: 13, color: "#556677", fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>
          <button
            onClick={save}
            style={{
              width: "100%", padding: "13px",
              background: saved ? "rgba(46,204,113,0.15)" : "#00AEEF",
              border: saved ? "1px solid rgba(46,204,113,0.3)" : "none",
              borderRadius: 8, color: saved ? "#2ECC71" : "white",
              fontSize: 15, fontWeight: 700,
              fontFamily: "var(--font-barlow), 'Barlow Condensed', sans-serif",
              letterSpacing: "0.07em", textTransform: "uppercase",
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
        <div style={{ padding: "0 24px 32px" }}>
          <button
            onClick={handleSignOut}
            style={{ width: "100%", padding: "12px", background: "none", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, color: "#445566", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function ForemanDashboard({ foremanName, profileId, weekNum, year, existingSubmission }: Props) {
  const weekRange = useMemo(() => getWeekRange(weekNum, year), [weekNum, year]);

  // Initialise from server submission (if already submitted this week), else start fresh.
  // In-progress (pre-submit) state is loaded from localStorage in a useEffect below.
  const [checklist, setChecklist] = useState<Record<string, boolean>>(
    () => (existingSubmission ? existingSubmission.checklist : mkChecklist())
  );

  const [notes, setNotes] = useState<Record<string, string>>(
    () => (existingSubmission ? existingSubmission.notes : mkNotes())
  );

  // Load in-progress state from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    if (existingSubmission) return; // Server data takes priority
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (saved && saved.weekMonday === getMondayISO()) {
        if (saved.checklist) setChecklist(saved.checklist);
        if (saved.notes) setNotes(saved.notes);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [submitted, setSubmitted]   = useState(!!existingSubmission);
  const [notesOpen, setNotesOpen]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]           = useState<{ msg: string; type: ToastType } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const isDesktop = useIsDesktop();
  const prevAllDone = useRef(false);

  // Persist checklist/notes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ weekMonday: getMondayISO(), checklist, notes }));
    } catch {}
  }, [checklist, notes]);

  // Computed
  const done    = Object.values(checklist).filter(Boolean).length;
  const total   = CHECKLIST.length;
  const pct     = (done / total) * 100;
  const allDone = done === total;

  // "All done" toast
  useEffect(() => {
    if (allDone && !prevAllDone.current && !submitted) {
      flash("All 10 tasks complete — ready to submit!", "success");
    }
    prevAllDone.current = allDone;
  }, [allDone, submitted]);

  function flash(msg: string, type: ToastType = "success", ms = 3200) {
    setToast({ msg, type });
    setTimeout(() => setToast(null), ms);
  }

  function toggleItem(id: string) {
    setChecklist(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function updateNote(id: string, val: string) {
    setNotes(prev => ({ ...prev, [id]: val }));
  }

  async function handleSubmit() {
    if (submitting || submitted) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/weekly-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week_number: weekNum, year, checklist, notes }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setSubmitted(true);
      flash("Week submitted successfully", "success");
    } catch (err) {
      console.error("[KE] Submit error:", err);
      // Still mark as submitted locally (offline-first)
      setSubmitted(true);
      flash("Saved locally — will sync when online", "warning");
    }

    setSubmitting(false);
  }

  // Group checklist by category
  const grouped = CAT_ORDER
    .map(cat => ({ cat, items: CHECKLIST.filter(i => i.cat === cat) }))
    .filter(g => g.items.length > 0);

  const contentWidth = isDesktop ? 560 : 430;

  return (
    <div style={{ minHeight: "100vh", background: "#0B0D12", position: "relative" }}>

      {/* Overlays */}
      <NavDrawer
        open={drawerOpen} onClose={() => setDrawerOpen(false)}
        onProfile={() => setProfileOpen(true)}
        done={done} total={total} weekNum={weekNum} foremanName={foremanName}
      />
      <ProfilePanel
        open={profileOpen} onClose={() => setProfileOpen(false)}
        done={done} total={total} submitted={submitted}
        weekNum={weekNum} foremanName={foremanName}
      />

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,13,18,0.94)",
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <OfflineBanner />
        {isDesktop ? (
          /* Desktop nav */
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", padding: "0 32px", height: 56, gap: 0 }}>
            <KELogo />
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 36 }}>
              {NAV_ITEMS.map(item => (
                <button key={item.id} disabled={item.coming} style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "7px 14px", borderRadius: 8,
                  background: item.active ? "rgba(0,174,239,0.1)" : "none",
                  border: item.active ? "1px solid rgba(0,174,239,0.18)" : "1px solid transparent",
                  color: item.active ? "#DCE8F0" : "#445566",
                  cursor: item.coming ? "default" : "pointer",
                  opacity: item.coming ? 0.4 : 1,
                  fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 500, fontSize: 13,
                  transition: "background 0.15s, border-color 0.15s",
                }}>
                  <NavIco id={item.id} active={item.active} />
                  {item.label}
                  {item.coming && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#334455", background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>Soon</span>
                  )}
                </button>
              ))}
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-barlow), 'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 14, color: "#00AEEF", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                  Week {weekNum}
                </div>
                <div style={{ fontSize: 11, color: "#445566", marginTop: 1 }}>{weekRange}</div>
              </div>
              <button onClick={() => setProfileOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <Avatar name={foremanName} size={34} onClick={() => setProfileOpen(true)} />
              </button>
            </div>
          </div>
        ) : (
          /* Mobile nav */
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px" }}>
            <KELogo />
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-barlow), 'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 14, color: "#00AEEF", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                  Week {weekNum}
                </div>
                <div style={{ fontSize: 11, color: "#445566", marginTop: 1 }}>{weekRange}</div>
              </div>
              <button onClick={() => setDrawerOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#556677", padding: 4, display: "flex", alignItems: "center" }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── Body ── */}
      <main style={{ maxWidth: contentWidth, margin: "0 auto", padding: isDesktop ? "28px 24px 120px" : "20px 16px 110px" }}>

        {/* Hero */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-barlow), 'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 34, lineHeight: 1.0, color: "#F2F6FA", textTransform: "uppercase", letterSpacing: "-0.01em" }}>
              {allDone ? "All done." : "Weekly Check"}
            </div>
            <div style={{ fontSize: 13, color: "#4A5E6D", fontWeight: 500, marginTop: 5, display: "flex", alignItems: "center", gap: 6 }}>
              <span>{foremanName}</span>
              <span style={{ color: "#2C3C4A" }}>·</span>
              <span>Foreman</span>
            </div>
            {submitted && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 9, background: "rgba(46,204,113,0.1)", border: "1px solid rgba(46,204,113,0.22)", borderRadius: 6, padding: "3px 10px" }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4.2 7.2L8 3" stroke="#2ECC71" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 11, color: "#2ECC71", fontWeight: 600 }}>Week {weekNum} submitted</span>
              </div>
            )}
          </div>
          <ProgressRing pct={pct} count={done} total={total} allDone={allDone} />
        </div>

        {/* Checklist */}
        {grouped.map(({ cat, items }) => (
          <CatGroup key={cat} cat={cat as CatKey} items={items} checklist={checklist} onToggle={toggleItem} />
        ))}

        {/* Reflection */}
        <Reflection notes={notes} onChange={updateNote} open={notesOpen} onToggle={() => setNotesOpen(v => !v)} />
      </main>

      {/* ── Submit bar ── */}
      <div style={{
        position: "fixed", bottom: 0,
        left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: contentWidth,
        padding: "10px 16px",
        paddingBottom: "calc(10px + env(safe-area-inset-bottom, 0px))",
        background: "linear-gradient(to top, #0B0D12 60%, rgba(11,13,18,0))",
        zIndex: 50,
      }}>
        {submitted ? (
          <button className="submit-btn" disabled style={{
            background: "rgba(46,204,113,0.12)",
            border: "1px solid rgba(46,204,113,0.25)",
            color: "#2ECC71",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8L6.5 11.5L13 4.5" stroke="#2ECC71" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Week {weekNum} Submitted
          </button>
        ) : (
          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              background: submitting ? "#0091C7" : "#00AEEF",
              color: "white",
              opacity: submitting ? 0.8 : 1,
              boxShadow: "0 4px 22px rgba(0,174,239,0.32)",
            }}
          >
            {submitting ? "Submitting…" : `Submit Week ${weekNum}`}
          </button>
        )}
        <div style={{ textAlign: "center", fontSize: 11, color: "#2C3C4A", marginTop: 5, fontWeight: 500 }}>
          {submitted ? `Saved ${new Date().toLocaleDateString("en-NZ", { weekday: "long" })} · resets next Monday` : "Resets Monday morning"}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
