"use client";

import { Suspense, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Link from "next/link";
import { Mail, ShoppingBag, ArrowRight, ChevronLeft, RefreshCw } from "lucide-react";

// ─── 6 individual OTP digit boxes ───────────────────────────────────────────

function OtpBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, "").split("").slice(0, 6);

  const update = (i: number, char: string) => {
    const next = digits.map((d, j) => (j === i ? char : d)).join("").replace(/\D/g, "").slice(0, 6);
    onChange(next);
    if (char && i < 5) refs.current[i + 1]?.focus();
  };
  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (p) { onChange(p); refs.current[Math.min(p.length, 5)]?.focus(); }
    e.preventDefault();
  };

  return (
    <div className="flex gap-2.5 justify-center">
      {Array(6).fill(0).map((_, i) => (
        <input key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="tel" inputMode="numeric" maxLength={1}
          value={digits[i] || ""}
          onChange={(e) => update(i, e.target.value.replace(/\D/g, "").slice(-1))}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          placeholder="·"
          className="w-11 h-14 text-center text-xl font-bold rounded-xl border-2 bg-white transition-all outline-none border-gray-200 text-gray-900 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 [&:not(:placeholder-shown)]:border-green-400 [&:not(:placeholder-shown)]:bg-green-50"
        />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

type Step = "email" | "otp";

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/";

  const [step,     setStep]    = useState<Step>("email");
  const [email,    setEmail]   = useState("");
  const [otp,      setOtp]     = useState("");
  const [loading,  setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = () => {
    setCooldown(60);
    const t = setInterval(() => setCooldown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  };

  const handleSendOtp = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const res = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim().toLowerCase(),
        type: "sign-in",
      });
      if (res.error) { toast.error(res.error.message ?? "Failed to send OTP"); return; }
      setStep("otp");
      startCooldown();
      toast.success("OTP sent to " + email);
    } catch {
      toast.error("Could not send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) { toast.error("Enter the 6-digit OTP"); return; }
    setLoading(true);
    try {
      const res = await authClient.signIn.emailOtp({
        email: email.trim().toLowerCase(),
        otp,
      });
      if (res.error) { toast.error(res.error.message ?? "Invalid OTP"); return; }
      toast.success("Welcome back!");
      router.push(redirect);
      router.refresh();
    } catch {
      toast.error("Invalid OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setOtp("");
    setLoading(true);
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email: email.trim().toLowerCase(),
        type: "sign-in",
      });
      startCooldown();
      toast.success("New OTP sent!");
    } catch {
      toast.error("Could not resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        {step === "otp" ? (
          <button onClick={() => { setStep("email"); setOtp(""); }}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm">
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
        ) : (
          <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm">
            <ChevronLeft size={18} className="text-gray-600" />
          </Link>
        )}
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
            <ShoppingBag size={14} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">Sadrax</span>
        </div>
        <div className="w-9" />
      </div>

      <div className="flex-1 flex items-start justify-center px-5 pt-8 pb-10">
        <div className="w-full max-w-sm space-y-6">

          {step === "email" && (
            <>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Sign in</h1>
                <p className="text-gray-500 text-sm mt-1">
                  New here?{" "}
                  <Link
                    href={`/register${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
                    className="text-green-600 font-semibold hover:underline"
                  >
                    Create account →
                  </Link>
                </p>
              </div>

              <div className="flex items-center rounded-2xl border-2 border-gray-200 bg-white focus-within:border-green-500 focus-within:shadow-[0_0_0_4px_rgba(22,163,74,0.1)] transition-all">
                <Mail size={17} className="ml-4 text-gray-400 shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  placeholder="your@email.com"
                  autoComplete="email"
                  className="flex-1 h-12 px-3 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400"
                />
              </div>

              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full h-14 bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-bold rounded-2xl transition-all shadow-lg shadow-green-600/25 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading
                  ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><span>Send OTP</span><ArrowRight size={18} /></>}
              </button>
            </>
          )}

          {step === "otp" && (
            <>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Enter OTP</h1>
                <p className="text-gray-500 text-sm mt-1">
                  Sent to <span className="font-semibold text-gray-800">{email}</span>
                </p>
              </div>

              <OtpBoxes value={otp} onChange={setOtp} />

              <button
                onClick={handleVerify}
                disabled={loading || otp.length !== 6}
                className="w-full h-14 bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-bold rounded-2xl transition-all shadow-lg shadow-green-600/25 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading
                  ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : "Verify & Sign In"}
              </button>

              <div className="text-center text-sm">
                {cooldown > 0 ? (
                  <span className="text-gray-400">
                    Resend in <span className="font-semibold text-gray-700">{cooldown}s</span>
                  </span>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={loading}
                    className="flex items-center gap-1.5 mx-auto text-green-600 font-semibold"
                  >
                    <RefreshCw size={14} /> Resend OTP
                  </button>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
