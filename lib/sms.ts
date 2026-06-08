import "server-only";

// Outbound SMS via Twilio Messages API — used for critical-check alerts (Verify
// is OTP-only and can't send arbitrary text). Needs a sender: either a Twilio
// number (TWILIO_FROM) or a Messaging Service (TWILIO_MESSAGING_SERVICE_SID).
const SID = process.env.TWILIO_ACCOUNT_SID;
const TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM = process.env.TWILIO_FROM;
const MSG_SID = process.env.TWILIO_MESSAGING_SERVICE_SID;

export function smsConfigured(): boolean {
  return Boolean(SID && TOKEN && (FROM || MSG_SID));
}

export async function sendSms(to: string, body: string): Promise<void> {
  if (!smsConfigured()) throw new Error("Twilio SMS sender not configured (set TWILIO_FROM or TWILIO_MESSAGING_SERVICE_SID).");
  const params = new URLSearchParams({ To: to, Body: body });
  if (MSG_SID) params.set("MessagingServiceSid", MSG_SID);
  else params.set("From", FROM!);
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${SID}:${TOKEN}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  if (!res.ok) throw new Error(`Twilio SMS failed (${res.status}): ${await res.text()}`);
}
