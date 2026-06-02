import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER!,
    pass: process.env.GMAIL_APP_PASSWORD!, // Gmail App Password (not account password)
  },
});

export async function sendOtpEmail(to: string, otp: string, name?: string): Promise<void> {
  const greeting = name ? `Hi ${name},` : "Hi there,";

  await transporter.sendMail({
    from: `"Sadrax Grocery" <${process.env.GMAIL_USER}>`,
    to,
    subject: `${otp} — Your Sadrax verification code`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your Sadrax OTP</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#16a34a,#059669);padding:36px 40px;text-align:center;">
            <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
              <span style="font-size:28px;">🛒</span>
            </div>
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Sadrax Grocery</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">Sadras &amp; Kalpakam</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;font-size:15px;color:#374151;">${greeting}</p>
            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
              Here's your one-time verification code. It expires in <strong style="color:#111827;">5 minutes</strong>.
            </p>
            <!-- OTP Box -->
            <div style="background:#f9fafb;border:2px dashed #d1fae5;border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Your OTP</p>
              <p style="margin:0;font-size:44px;font-weight:900;color:#16a34a;letter-spacing:12px;">${otp}</p>
            </div>
            <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;line-height:1.6;">
              If you didn't request this, you can safely ignore this email. Someone may have entered your email by mistake.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
              © ${new Date().getFullYear()} Sadrax Grocery · Sadras, Tamil Nadu
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}
