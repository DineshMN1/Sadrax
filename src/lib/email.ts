import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.resend.com",
  port: 465,
  secure: true,
  auth: {
    user: "resend",
    pass: process.env.GMAIL_APP_PASSWORD!,
  },
});

const STORE   = process.env.NEXT_PUBLIC_STORE_NAME?.replace(/\s*grocery\s*/i, "").trim() || "Sadrax";
const TAGLINE = process.env.NEXT_PUBLIC_STORE_TAGLINE ?? "by Malik Stores";
const PHONE   = process.env.NEXT_PUBLIC_STORE_PHONE ?? "";
const ADDRESS = process.env.NEXT_PUBLIC_STORE_ADDRESS ?? "Sadras, Kalpakam, Tamil Nadu — 603102";

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// OTP rendered as a single unified box so it can be easily copied with a double-click.
function digitBoxes(otp: string): string {
  return `<td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 24px 14px 36px;text-align:center;">
    <span style="font-size:32px;font-weight:700;color:#15803d;letter-spacing:12px;font-variant-numeric:tabular-nums;">${otp}</span>
  </td>`;
}

// Builds the OTP email — reused by the sender and the dev preview route.
export function buildOtpEmail(otp: string, name?: string): { subject: string; html: string } {
  const firstName = name?.trim().split(" ")[0];
  const safeFirstName = firstName ? escapeHtml(firstName) : undefined;
  const greeting = safeFirstName ? `Hi ${safeFirstName},` : "Hi,";

  const html = `<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Your ${STORE} code</title>
</head>
<body style="margin:0;padding:0;background:#f6f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:48px 16px;">
    <tr><td align="center">
      <table width="440" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border:1px solid #ececec;border-radius:16px;overflow:hidden;max-width:440px;width:100%;">

        <!-- Thin green accent -->
        <tr><td style="height:4px;background:#16a34a;font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Header -->
        <tr><td style="background:#f0fdf4;border-bottom:1px solid #dcfce7;padding:30px 44px 26px;text-align:center;">
          <p style="margin:0;font-size:18px;font-weight:800;color:#15803d;letter-spacing:2px;">SADRAX</p>
          <p style="margin:5px 0 0;font-size:11px;color:#86b69a;letter-spacing:0.5px;">${TAGLINE}</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:30px 44px 8px;">
          <p style="margin:0 0 6px;font-size:15px;color:#111827;font-weight:600;">${greeting}</p>
          <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">Use the verification code below to sign in. This code is valid for <strong style="color:#374151;font-weight:600;">5 minutes</strong>.</p>
        </td></tr>

        <!-- Code -->
        <tr><td style="padding:24px 44px 6px;text-align:center;">
          <p style="margin:0 0 14px;font-size:10px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:2px;">Verification code</p>
          <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;"><tr>${digitBoxes(otp)}</tr></table>
        </td></tr>

        <!-- Security note -->
        <tr><td style="padding:22px 44px 0;">
          <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.7;">For your security, never share this code with anyone. ${STORE} will never ask for it. If you didn't request this, you can safely ignore this email.</p>
        </td></tr>

        <tr><td style="height:28px;font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Footer -->
        <tr><td style="background:#f0fdf4;border-top:1px solid #dcfce7;padding:22px 44px 26px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#6b7280;font-weight:600;">${STORE} <span style="color:#9ca3af;font-weight:500;">${TAGLINE}</span></p>
          ${PHONE ? `<p style="margin:5px 0 0;font-size:12px;"><a href="tel:+91${PHONE}" style="color:#16a34a;text-decoration:none;font-weight:600;">+91 ${PHONE}</a></p>` : ""}
          <p style="margin:6px 0 0;font-size:11px;color:#9aa6ac;">${ADDRESS}</p>
        </td></tr>

      </table>
      <p style="margin:18px 0 0;font-size:11px;color:#c4c8cd;">© ${new Date().getFullYear()} ${STORE}. Automated message — please don't reply.</p>
    </td></tr>
  </table>
</body></html>`;

  return { subject: `${otp} is your ${STORE} verification code`, html };
}

export async function sendOtpEmail(to: string, otp: string, name?: string): Promise<void> {
  const { subject, html } = buildOtpEmail(otp, name);
  await transporter.sendMail({
    from: `"${STORE} ${TAGLINE}" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}
