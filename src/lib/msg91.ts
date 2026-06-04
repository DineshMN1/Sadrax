// sendOtp is active — used by Better Auth for email OTP login.

export async function sendOtp(phone: string, otp: string): Promise<void> {
  const authKey    = process.env.MSG91_AUTH_KEY!;
  const templateId = process.env.MSG91_TEMPLATE_ID!;
  const normalized = phone.startsWith("+") ? phone.slice(1) : phone.startsWith("91") ? phone : `91${phone}`;

  const res = await fetch("https://control.msg91.com/api/v5/otp", {
    method: "POST",
    headers: { "Content-Type": "application/json", authkey: authKey },
    body: JSON.stringify({ template_id: templateId, mobile: normalized, otp }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MSG91 error: ${text}`);
  }
}

// ╔══════════════════════════════════════════════════════════════════╗
// ║  NOT IN PLAN FOR NOW — Order status SMS notifications            ║
// ║  Enable when: MSG91 flow/template IDs are configured             ║
// ║  Calls are commented out in: api/orders/route.ts,               ║
// ║    api/orders/[id]/route.ts, api/cord/orders/[id]/status/route.ts║
// ╚══════════════════════════════════════════════════════════════════╝

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function sendSms(_phone: string, _message: string): Promise<void> {
  // NOT IN PLAN FOR NOW
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function sendOrderStatusSms(
  _phone: string,
  _orderNumber: string,
  _status: string
): Promise<void> {
  // NOT IN PLAN FOR NOW
}
