"use client";

const KPI_CARDS = [
  {
    id: "charge_out",
    label: "Charge Out",
    value: "--",
    unit: "%",
    target: "85%",
    description: "Billable hours vs available",
    icon: "⚡",
    color: "text-brand",
  },
  {
    id: "job_cards",
    label: "Job Cards",
    value: "--",
    unit: "",
    target: "20",
    description: "Completed this month",
    icon: "📋",
    color: "text-green-400",
  },
  {
    id: "callbacks",
    label: "Callbacks",
    value: "--",
    unit: "",
    target: "< 2",
    description: "Rework callbacks",
    icon: "📞",
    color: "text-red-400",
  },
  {
    id: "timesheets",
    label: "Timesheets",
    value: "--",
    unit: " days",
    target: "10",
    description: "On-time submissions",
    icon: "🗓",
    color: "text-yellow-400",
  },
];

export default function SparkeyDashboard() {
  const today = new Date();
  const month = today.toLocaleDateString("en-NZ", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="bg-surface border-b border-border px-4 py-5 safe-top">
        <p className="text-xs text-text-secondary mb-1">{month}</p>
        <h1 className="text-xl font-bold text-text-primary">My KPIs</h1>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* Score card */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-widest">Monthly score</p>
              <div className="text-4xl font-bold text-brand mt-1">--<span className="text-2xl text-text-secondary">/100</span></div>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-secondary">Bonus earned</p>
              <p className="text-2xl font-bold text-green-400 mt-1">$--</p>
            </div>
          </div>
          {/* Score bar */}
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-brand rounded-full" style={{ width: "0%" }} />
          </div>
          <p className="text-xs text-text-secondary mt-2">Data will appear once your admin enters monthly figures</p>
        </div>

        {/* Team score */}
        <div className="bg-brand/10 border border-brand/20 rounded-2xl px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center text-lg">🏆</div>
          <div>
            <p className="text-xs text-text-secondary">Team score this month</p>
            <p className="text-xl font-bold text-brand">--<span className="text-sm text-text-secondary font-normal"> avg</span></p>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3">
          {KPI_CARDS.map((kpi) => (
            <div key={kpi.id} className="bg-surface border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl">{kpi.icon}</span>
                <span className="text-xs text-text-secondary">Target: {kpi.target}</span>
              </div>
              <div className={`text-2xl font-bold ${kpi.color}`}>
                {kpi.value}{kpi.unit}
              </div>
              <p className="text-xs font-medium text-text-primary mt-1">{kpi.label}</p>
              <p className="text-xs text-text-secondary mt-0.5">{kpi.description}</p>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="bg-surface border border-border rounded-2xl px-4 py-4">
          <p className="text-xs text-text-secondary text-center">
            KPI data is entered monthly by your admin. Check back at the start of next month.
          </p>
        </div>
      </div>
    </div>
  );
}
