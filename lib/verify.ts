import "server-only";

// Twilio Verify (managed OTP) — replaces the old Messaging Service SMS sender.
// Verify composes its own message ("Your Kiwitown code is 123456"), handles
// rate limiting, retries and sender selection. We only send + check codes.
// Server-only: relies on secret env vars, never import into client code.

const SID = process.env.TWILIO_ACCOUNT_SID;
const TOKEN = process.env.TWILIO_AUTH_TOKEN;
const VERIFY_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

export function verifyConfigured(): boolean {
  return Boolean(SID && TOKEN && VERIFY_SID);
}

function authHeader(): string {
  return "Basic " + Buffer.from(`${SID}:${TOKEN}`).toString("base64");
}

// Send an OTP code to an E.164 phone number. https://www.twilio.com/docs/verify/api/verification
export async function sendVerification(phone: string): Promise<{ status: string }> {
  if (!verifyConfigured()) throw new Error("Twilio Verify is not configured.");
  const res = await fetch(`https://verify.twilio.com/v2/Services/${VERIFY_SID}/Verifications`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: phone, Channel: "sms" }).toString(),
  });
  if (!res.ok) throw new Error(`Twilio Verify send failed (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as { status: string };
  return { status: data.status };
}

// Check a user-entered code. True only when Verify reports "approved".
// https://www.twilio.com/docs/verify/api/verification-check
export async function checkVerification(phone: string, code: string): Promise<boolean> {
  if (!verifyConfigured()) throw new Error("Twilio Verify is not configured.");
  const res = await fetch(`https://verify.twilio.com/v2/Services/${VERIFY_SID}/VerificationCheck`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: phone, Code: code }).toString(),
  });
  // A wrong/expired code returns 404 with status "pending" or an error — treat
  // any non-approved result as a failed check rather than a thrown error.
  if (!res.ok) {
    if (res.status === 404) return false;
    throw new Error(`Twilio Verify check failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { status: string };
  return data.status === "approved";
}
