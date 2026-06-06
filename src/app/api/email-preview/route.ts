import { NextRequest } from "next/server";
import { buildOtpEmail } from "@/lib/email";

// Dev-only: preview the OTP email in the browser.
//   http://localhost:3000/api/email-preview?name=Dinesh&otp=482931
export function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }
  const { searchParams } = req.nextUrl;
  const name = searchParams.get("name") ?? "Dinesh";
  const otp = searchParams.get("otp") ?? "482931";
  const { html } = buildOtpEmail(otp, name || undefined);
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
