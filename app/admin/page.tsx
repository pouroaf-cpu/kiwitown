"use client";

const PLACEHOLDER_USERS = [
  { id: "1", name: "Luke Henderson", phone: "021 234 5678", role: "foreman" },
  { id: "2", name: "Sam Taufa", phone: "021 876 5432", role: "sparky" },
  { id: "3", name: "Jordan Parata", phone: "027 000 1234", role: null },
];

const ROLE_LABELS: Record<string, { label: string; colour: string }> = {
  admin: { label: "Admin", colour: "bg-purple-500/20 text-purple-300" },
  foreman: { label: "Foreman", colour: "bg-brand/20 text-brand" },
  sparky: { label: "Sparky", colour: "bg-yellow-500/20 text-yellow-300" },
};

export default function AdminDashboard() {
  const today = new Date();
  const month = today.toLocaleDateString("en-NZ", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="bg-surface border-b border-border px-4 py-5 safe-top">
        <p className="text-xs text-text-secondary mb-1">Admin · {month}</p>
        <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>
      </div>

      <div className="px-4 pt-5 space-y-6">
        {/* Stat row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total crew", value: "—" },
            { label: "Foremen", value: "—" },
            { label: "Sparkies", value: "—" },
          ].map((s) => (
            <div key={s.label} className="bg-surface border border-border rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-brand">{s.value}</div>
              <div className="text-xs text-text-secondary mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Monthly overview placeholder */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Monthly overview</h2>
          <div className="h-28 rounded-xl bg-border/40 flex items-center justify-center">
            <p className="text-xs text-text-secondary">Chart coming soon</p>
          </div>
        </div>

        {/* User list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
              Team members
            </h2>
            <button className="text-xs text-brand font-medium active:opacity-70">
              + Add
            </button>
          </div>
          <div className="bg-surface border border-border rounded-2xl overflow-hidden divide-y divide-border">
            {PLACEHOLDER_USERS.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold text-sm shrink-0">
                  {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{u.name}</p>
                  <p className="text-xs text-text-secondary">{u.phone}</p>
                </div>
                {/* Role badge / assign */}
                {u.role ? (
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      ROLE_LABELS[u.role]?.colour ?? "bg-border text-text-secondary"
                    }`}
                  >
                    {ROLE_LABELS[u.role]?.label ?? u.role}
                  </span>
                ) : (
                  <button className="text-xs bg-brand/20 text-brand px-3 py-1.5 rounded-full font-medium active:opacity-70">
                    Assign
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-text-secondary text-center pb-4">
          Connect Supabase to load live data
        </p>
      </div>
    </div>
  );
}
