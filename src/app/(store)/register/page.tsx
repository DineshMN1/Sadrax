"use client";

import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  User, Phone, Mail, ArrowRight, CheckCircle2,
  RefreshCw, ChevronLeft, ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

// ─── OTP digit-box input ────────────────────────────────────────────────────

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, "").split("").slice(0, 6);

  const update = (idx: number, char: string) => {
    const next = digits.map((d, i) => (i === idx ? char : d)).join("").replace(/[^0-9]/g, "").slice(0, 6);
    onChange(next);
    if (char && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKey = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) { onChange(pasted); refs.current[Math.min(pasted.length, 5)]?.focus(); }
    e.preventDefault();
  };

  return (
    <div className="flex gap-2.5 justify-center">
      {Array(6).fill(0).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ""}
          onChange={(e) => update(i, e.target.value.replace(/\D/g, "").slice(-1))}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className="w-11 h-14 text-center text-xl font-bold rounded-xl border-2 bg-white transition-all outline-none
            border-gray-200 text-gray-900
            focus:border-green-500 focus:ring-4 focus:ring-green-500/10
            [&:not(:placeholder-shown)]:border-green-400 [&:not(:placeholder-shown)]:bg-green-50"
          placeholder="·"
        />
      ))}
    </div>
  );
}

// ─── Floating-label input ────────────────────────────────────────────────────

function Field({
  label, value, onChange, type = "text", icon: Icon,
  placeholder, hint, autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  icon: React.ElementType;
  placeholder?: string;
  hint?: string;
  autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || !!value;

  return (
    <div>
      <div className={`relative flex items-center rounded-2xl border-2 bg-white transition-all duration-200 ${
        focused ? "border-green-500 shadow-[0_0_0_4px_rgba(22,163,74,0.1)]" : "border-gray-200"
      }`}>
        <Icon
          size={17}
          className={`absolute left-4 transition-colors duration-200 ${focused ? "text-green-600" : "text-gray-400"}`}
        />
        <div className="flex-1 relative pt-5 pb-2 pl-11 pr-4">
          <label
            className={`absolute left-11 transition-all duration-200 pointer-events-none ${
              active
                ? "top-2 text-[10px] font-semibold text-green-600 uppercase tracking-wider"
                : "top-1/2 -translate-y-1/2 text-sm text-gray-400"
            }`}
          >
            {label}
          </label>
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={focused ? placeholder : ""}
            autoComplete={autoComplete}
            className="w-full bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-300"
          />
        </div>
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1.5 ml-1">{hint}</p>}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

type Step = "details" | "otp" | "done";

function RegisterContent() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/";

  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const validateDetails = () => {
    if (!name.trim() || name.trim().length < 2) { toast.error("Enter your full name"); return false; }
    const ph = phone.replace(/\D/g, "");
    if (ph.length !== 10) { toast.error("Enter a valid 10-digit mobile number"); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Enter a valid email address"); return false; }
    return true;
  };

  const handleSendOtp = useCallback(async () => {
    if (!validateDetails()) return;
    setLoading(true);
    try {
      const res = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim().toLowerCase(),
        type: "sign-in",
      });
      if (res.error) { toast.error(res.error.message ?? "Could not send OTP"); return; }
      setStep("otp");
      setResendCooldown(60);
      toast.success("OTP sent to " + email);
    } catch {
      toast.error("Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, phone, email]);

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { toast.error("Enter the 6-digit OTP"); return; }
    setLoading(true);
    try {
      const res = await authClient.signIn.emailOtp({
        email: email.trim().toLowerCase(),
        otp,
      });
      if (res.error) { toast.error(res.error.message ?? "Invalid OTP"); return; }

      // Update profile with name + phone
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: `+91${phone.replace(/\D/g, "")}` }),
      });

      setStep("done");
      setTimeout(() => { router.push(redirect); router.refresh(); }, 1800);
    } catch {
      toast.error("Verification failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email: email.trim().toLowerCase(),
        type: "sign-in",
      });
      setResendCooldown(60);
      setOtp("");
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
        {step !== "details" && step !== "done" ? (
          <button
            onClick={() => { setStep("details"); setOtp(""); }}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 shadow-sm"
          >
            <ChevronLeft size={18} />
          </button>
        ) : (
          <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 shadow-sm">
            <ChevronLeft size={18} />
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

      {/* Step dots */}
      <div className="flex justify-center gap-2 py-3">
        {(["details", "otp", "done"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`rounded-full transition-all duration-300 ${
              step === s
                ? "w-6 h-2 bg-green-600"
                : i < (["details","otp","done"] as Step[]).indexOf(step)
                  ? "w-2 h-2 bg-green-400"
                  : "w-2 h-2 bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Card */}
      <div className="flex-1 flex items-start justify-center px-5 pt-4 pb-10">
        <div className="w-full max-w-sm">

          {/* ── Step 1: Details ─────────────────────────────── */}
          {step === "details" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
                  Create your account
                </h1>
                <p className="text-gray-500 text-sm mt-1.5">
                  Already have one?{" "}
                  <Link href="/login" className="text-green-600 font-semibold hover:underline">Sign in</Link>
                </p>
              </div>

              <div className="space-y-3">
                <Field
                  label="Full Name"
                  value={name}
                  onChange={setName}
                  icon={User}
                  placeholder="Dinesh Kumar"
                  autoComplete="name"
                />
                <div className={`relative flex items-center rounded-2xl border-2 bg-white transition-all duration-200 border-gray-200`}>
                  <Phone size={17} className="absolute left-4 text-gray-400" />
                  <div className="flex-1 relative pt-5 pb-2 pl-11 pr-4">
                    <label className={`absolute left-11 transition-all duration-200 pointer-events-none ${
                      phone ? "top-2 text-[10px] font-semibold text-green-600 uppercase tracking-wider" : "top-1/2 -translate-y-1/2 text-sm text-gray-400"
                    }`}>Mobile Number</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-500 shrink-0">+91</span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder={phone ? "98765 43210" : ""}
                        autoComplete="tel"
                        className="flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-300"
                      />
                    </div>
                  </div>
                </div>
                <Field
                  label="Email Address"
                  value={email}
                  onChange={setEmail}
                  type="email"
                  icon={Mail}
                  placeholder="you@example.com"
                  hint="Your OTP will be sent here"
                  autoComplete="email"
                />
              </div>

              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full h-14 bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-bold text-base rounded-2xl transition-all shadow-lg shadow-green-600/25 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><span>Send OTP to Email</span><ArrowRight size={18} /></>
                )}
              </button>

              <p className="text-center text-xs text-gray-400">
                By continuing you agree to our{" "}
                <span className="text-green-600 font-medium cursor-pointer">Terms &amp; Privacy Policy</span>
              </p>
            </div>
          )}

          {/* ── Step 2: OTP ─────────────────────────────────── */}
          {step === "otp" && (
            <div className="space-y-6">
              <div>
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                  <Mail size={26} className="text-green-600" />
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
                  Check your inbox
                </h1>
                <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">
                  We sent a 6-digit code to{" "}
                  <span className="font-semibold text-gray-800">{email}</span>
                </p>
              </div>

              <div className="space-y-3">
                <OtpInput value={otp} onChange={setOtp} />
                <p className="text-center text-xs text-gray-400">
                  Enter the 6-digit code from your email
                </p>
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                className="w-full h-14 bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-bold text-base rounded-2xl transition-all shadow-lg shadow-green-600/25 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><CheckCircle2 size={18} /><span>Verify &amp; Continue</span></>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-sm">
                {resendCooldown > 0 ? (
                  <span className="text-gray-400">Resend in <span className="font-semibold text-gray-600">{resendCooldown}s</span></span>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={loading}
                    className="flex items-center gap-1.5 text-green-600 font-semibold hover:text-green-700"
                  >
                    <RefreshCw size={14} /> Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Done ─────────────────────────────────── */}
          {step === "done" && (
            <div className="flex flex-col items-center text-center py-8 space-y-5">
              <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center">
                <CheckCircle2 size={42} className="text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Welcome, {name.split(" ")[0]}!</h1>
                <p className="text-gray-500 text-sm mt-2">Your account is ready. Taking you to the store…</p>
              </div>
              <div className="w-8 h-1 bg-green-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-600 rounded-full animate-[grow_1.8s_ease-in-out_forwards]" />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
}
