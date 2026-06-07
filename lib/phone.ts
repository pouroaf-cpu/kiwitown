// Best-effort NZ → E.164 normalisation. Accepts 021…, 6421…, +6421….
export function toE164NZ(raw: string): string {
  const t = raw.replace(/[\s()-]/g, "");
  if (t.startsWith("+")) return t;
  if (t.startsWith("0")) return "+64" + t.slice(1);
  if (t.startsWith("64")) return "+" + t;
  return t;
}
