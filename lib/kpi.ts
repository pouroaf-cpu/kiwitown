import type { KpiEntry, KpiTarget, KpiType } from "@/lib/types";

export const DEFAULT_TARGETS: Record<KpiType, number> = {
  charge_out: 85,
  job_cards: 20,
  callbacks: 2,
  timesheets_days: 10,
};

export function resolveTargets(targets: KpiTarget[], sparkyId?: string) {
  return (Object.keys(DEFAULT_TARGETS) as KpiType[]).reduce<Record<KpiType, number>>(
    (resolved, type) => {
      const specific = targets.find((target) => target.target_type === type && target.sparky_id === sparkyId);
      const global = targets.find((target) => target.target_type === type && target.sparky_id === null);
      resolved[type] = Number(specific?.value ?? global?.value ?? DEFAULT_TARGETS[type]);
      return resolved;
    },
    { ...DEFAULT_TARGETS }
  );
}

export function calculateScore(values: Pick<KpiEntry, KpiType>, targets: Record<KpiType, number>) {
  const chargeOut = Math.min((values.charge_out / targets.charge_out) * 100, 100);
  const jobCards = Math.min((values.job_cards / targets.job_cards) * 100, 100);
  const callbacks = values.callbacks <= targets.callbacks
    ? 100
    : Math.max(0, (1 - (values.callbacks - targets.callbacks) / 5) * 100);
  const timesheets = Math.min((values.timesheets_days / targets.timesheets_days) * 100, 100);
  return Number(((chargeOut + jobCards + callbacks + timesheets) / 4).toFixed(2));
}

export function calculateBonus(score: number, salary: number, bonusPct: number) {
  return Number(((score / 100) * (salary / 12) * (bonusPct / 100)).toFixed(2));
}
