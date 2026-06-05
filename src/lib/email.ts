import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER!,
    pass: process.env.GMAIL_APP_PASSWORD!,
  },
});

export async function sendOtpEmail(to: string, otp: string, name?: string): Promise<void> {
  const firstName   = name?.trim().split(" ")[0];
  const greeting    = firstName ? `Hi ${firstName}!` : "Hi there!";
  const subGreeting = firstName
    ? `Welcome back, ${firstName}. Use the code below to sign in.`
    : "Use the code below to verify your email and sign in.";

  const digits = otp.split("").join("&nbsp;&nbsp;");

  await transporter.sendMail({
    from: `"Sadrax Grocery" <${process.env.GMAIL_USER}>`,
    to,
    subject: `${otp} is your Sadrax verification code`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Your Sadrax OTP</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" role="presentation"
        style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);max-width:480px;width:100%;">

        <!-- Green header -->
        <tr>
          <td style="background:linear-gradient(135deg,#16a34a 0%,#059669 100%);padding:40px 40px 32px;text-align:center;">
            <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto 16px;">
              <tr><td style="background:rgba(255,255,255,0.18);border-radius:18px;width:64px;height:64px;text-align:center;vertical-align:middle;font-size:30px;line-height:64px;">
                🛒
              </td></tr>
            </table>
            <h1 style="margin:0 0 4px;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Sadrax Grocery</h1>
            <p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px;">Sadras &amp; Kalpakam — Fast Local Delivery</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 28px;">
            <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">${greeting}</h2>
            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">${subGreeting}</p>

            <!-- OTP block -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
              style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:16px;margin-bottom:28px;">
              <tr>
                <td style="padding:28px 24px;text-align:center;">
                  <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:2px;">Your one-time code</p>
                  <p style="margin:0;font-size:48px;font-weight:900;color:#16a34a;letter-spacing:14px;font-variant-numeric:tabular-nums;">${digits}</p>
                  <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">⏱ Expires in <strong style="color:#374151;">5 minutes</strong></p>
                </td>
              </tr>
            </table>

            <!-- Warning -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
              style="background:#fefce8;border-left:4px solid #fbbf24;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:12px 16px;">
                  <p style="margin:0;font-size:13px;color:#92400e;">
                    <strong>Never share this code</strong> with anyone. Sadrax will never ask for your OTP.
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
              Didn't request this? You can safely ignore this email. Your account remains secure.
            </p>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 40px;"><div style="height:1px;background:#f3f4f6;"></div></td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#374151;">Sadrax Grocery</p>
            <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">Sadras, Kalpakam, Tamil Nadu — 603102</p>
            <p style="margin:8px 0 0;font-size:11px;color:#d1d5db;">© ${new Date().getFullYear()} Sadrax. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}
