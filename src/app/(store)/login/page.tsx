"use client";

import { Suspense, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Link from "next/link";
import { Mail, ShoppingBag, ArrowRight, ChevronLeft, RefreshCw, Sparkles } from "lucide-react";

// ─── 6 individual OTP digit boxes ────────────────────────────────────────────

function OtpBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

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
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ""}
          onChange={e => update(i, e.target.value.replace(/\D/g, "").slice(-1))}
          onKeyDown={e => handleKey(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          placeholder="·"
          className="w-11 h-14 text-center text-xl font-bold rounded-2xl border-2 bg-white transition-all outline-none border-gray-200 text-gray-900 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 not-placeholder-shown:border-green-400 not-placeholder-shown:bg-green-50 shadow-sm"
        />
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

type Step = "email" | "otp";

function LoginContent() {
  const router   = useRouter();
  const params   = useSearchParams();
  const redirect = params.get("redirect") ?? "/";

  const [step,     setStep]    = useState<Step>("email");
  const [email,    setEmail]   = useState("");
  const [otp,      setOtp]     = useState("");
  const [loading,  setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = () => {
    setCooldown(60);
    const t = setInterval(() => setCooldown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  };

  const handleSendOtp = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      // Check if user exists — if not, send them to register
      const check = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const { exists } = await check.json();

      if (!exists) {
        router.push(`/register?email=${encodeURIComponent(email.trim().toLowerCase())}${redirect !== "/" ? `&redirect=${encodeURIComponent(redirect)}` : ""}`);
        return;
      }

      const res = await authClient.emailOtp.sendVerificationOtp({ email: email.trim().toLowerCase(), type: "sign-in" });
      if (res.error) { toast.error(res.error.message ?? "Failed to send OTP"); return; }
      setStep("otp");
      startCooldown();
      toast.success("OTP sent!", { description: email });
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
      const res = await authClient.signIn.emailOtp({ email: email.trim().toLowerCase(), otp });
      if (res.error) { toast.error(res.error.message ?? "Invalid OTP"); return; }
      toast.success("Welcome back! 👋");
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
      await authClient.emailOtp.sendVerificationOtp({ email: email.trim().toLowerCase(), type: "sign-in" });
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
          <button
            onClick={() => { setStep("email"); setOtp(""); }}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
        ) : (
          <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
            <ChevronLeft size={18} className="text-gray-600" />
          </Link>
        )}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-linear-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
            <ShoppingBag size={15} className="text-white" />
          </div>
          <span className="font-extrabold text-gray-900 text-sm">Sadrax</span>
        </div>
        <div className="w-9" />
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm space-y-6">

          {step === "email" && (
            <>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Welcome back</h1>
                <p className="text-gray-500 text-sm mt-1">
                  New here?{" "}
                  <Link
                    href={`/register${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
                    className="text-green-600 font-bold hover:underline"
                  >
                    Create account →
                  </Link>
                </p>
              </div>

              <div className="flex items-center rounded-2xl border-2 border-gray-200 bg-white focus-within:border-green-500 focus-within:shadow-[0_0_0_4px_rgba(22,163,74,0.08)] transition-all">
                <div className="w-11 h-12 flex items-center justify-center shrink-0">
                  <Mail size={17} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSendOtp()}
                  placeholder="your@email.com"
                  autoComplete="email"
                  className="flex-1 h-12 pr-4 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400"
                />
              </div>

              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full h-14 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 active:scale-[0.98] text-white font-bold rounded-2xl transition-all shadow-lg shadow-green-600/25 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading
                  ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><span>Send OTP</span><ArrowRight size={18} /></>}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center">
                  <span className="bg-gray-50 px-3 text-xs text-gray-400 font-medium">We&apos;ll email you a one-time code</span>
                </div>
              </div>
            </>
          )}

          {step === "otp" && (
            <>
              <div>
                <div className="w-14 h-14 bg-linear-to-br from-green-50 to-emerald-100 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  <Sparkles size={24} className="text-green-600" />
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900">Enter OTP</h1>
                <p className="text-gray-500 text-sm mt-1">
                  Sent to <span className="font-semibold text-gray-800">{email}</span>
                </p>
              </div>

              <OtpBoxes value={otp} onChange={setOtp} />

              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 -mt-1">
                <span className="text-base shrink-0">📬</span>
                <p className="text-xs font-semibold text-amber-800">
                  Didn&apos;t receive the OTP? Check your <span className="underline underline-offset-2">spam / junk</span> folder.
                </p>
              </div>

              <button
                onClick={handleVerify}
                disabled={loading || otp.length !== 6}
                className="w-full h-14 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 active:scale-[0.98] text-white font-bold rounded-2xl transition-all shadow-lg shadow-green-600/25 disabled:opacity-50 flex items-center justify-center gap-2"
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
                    className="flex items-center gap-1.5 mx-auto text-green-600 font-semibold hover:text-green-700 transition-colors"
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
