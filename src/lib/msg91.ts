export async function sendOtp(phone: string, otp: string): Promise<void> {
  const authKey = process.env.MSG91_AUTH_KEY!;
  const templateId = process.env.MSG91_TEMPLATE_ID!;

  // Normalize phone to 91XXXXXXXXXX format
  const normalized = phone.startsWith("+") ? phone.slice(1) : phone.startsWith("91") ? phone : `91${phone}`;

  const res = await fetch("https://control.msg91.com/api/v5/otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authkey: authKey,
    },
    body: JSON.stringify({
      template_id: templateId,
      mobile: normalized,
      otp,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MSG91 error: ${text}`);
  }
}

export async function sendSms(phone: string, message: string): Promise<void> {
  const authKey = process.env.MSG91_AUTH_KEY!;
  const normalized = phone.startsWith("+") ? phone.slice(1) : phone.startsWith("91") ? phone : `91${phone}`;

  await fetch("https://control.msg91.com/api/v5/flow/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authkey: authKey,
    },
    body: JSON.stringify({
      mobiles: normalized,
      message,
    }),
  });
}

export async function sendOrderStatusSms(
  phone: string,
  orderNumber: string,
  status: string
): Promise<void> {
  const messages: Record<string, string> = {
    accepted: `Your Sadrax order #${orderNumber} has been accepted and is being prepared.`,
    packed: `Your Sadrax order #${orderNumber} is packed and ready.`,
    out_for_delivery: `Your Sadrax order #${orderNumber} is out for delivery. It will reach you shortly!`,
    delivered: `Your Sadrax order #${orderNumber} has been delivered. Thank you for shopping with us!`,
    rejected: `Your Sadrax order #${orderNumber} could not be processed. Please contact us for help.`,
  };

  const msg = messages[status];
  if (msg) await sendSms(phone, msg);
}
