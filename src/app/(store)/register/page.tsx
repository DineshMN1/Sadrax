"use client";

import { Suspense, useState, useRef, useEffect, useCallback, lazy } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { track } from "@/lib/analytics";
import {
  User, Phone, Mail, ArrowRight, CheckCircle2,
  RefreshCw, ChevronLeft, ShoppingBag, MapPin, Navigation,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import loadDynamic from "next/dynamic";

const LocationPicker = loadDynamic(
  () => import("@/components/store/location-picker").then(m => ({ default: m.LocationPicker })),
  { ssr: false }
);

// ─── OTP digit-box input ────────────────────────────────────────────────────

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

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
            not-placeholder-shown:border-green-400 not-placeholder-shown:bg-green-50"
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

// ─── Address step ────────────────────────────────────────────────────────────

interface AddressStepProps {
  userName: string;
  userPhone: string;
  redirect: string;
  onDone: () => void;
}

function AddressStep({ userName, userPhone, redirect, onDone }: AddressStepProps) {
  const isCheckout = redirect.includes("checkout");
  const [showMap, setShowMap] = useState(false);
  const [pinLat, setPinLat] = useState<number | null>(null);
  const [pinLng, setPinLng] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    label: "home",
    line1: "",
    line2: "",
    city: "Sadras",
    pincode: "",
  });

  const handlePinConfirm = (pos: { lat: number; lng: number }, display?: string) => {
    setPinLat(pos.lat);
    setPinLng(pos.lng);
    setShowMap(false);
    // Pre-fill pincode from display address if detectable
    const pincodeMatch = display?.match(/\b6\d{5}\b/);
    if (pincodeMatch) setForm(p => ({ ...p, pincode: pincodeMatch[0] }));
    // Try to extract area name
    const parts = display?.split(",") ?? [];
    if (parts.length >= 2) {
      const area = parts.slice(0, 2).join(",").trim().slice(0, 80);
      setForm(p => ({ ...p, line1: area }));
    }
  };

  const handleSave = async () => {
    if (!form.line1 || !form.pincode) { toast.error("Enter street / area and pincode"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          name: userName,
          phone: userPhone,
          lat: pinLat,
          lng: pinLng,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Could not save address"); return; }
      toast.success("Address saved!");
      onDone();
    } finally {
      setSaving(false);
    }
  };

  if (showMap) {
    return (
      <div className="-mx-5 -mt-4 h-[calc(100vh-160px)] flex flex-col">
        <div className="px-5 pt-4 pb-2">
          <h2 className="text-base font-bold text-gray-900">Drop pin on your home</h2>
          <p className="text-xs text-gray-400 mt-0.5">Drag the marker or tap on the map to set your location</p>
        </div>
        <div className="flex-1 min-h-0">
          <LocationPicker
            onConfirm={handlePinConfirm}
            onClose={() => setShowMap(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
          <MapPin size={22} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">Add your address</h1>
        <p className="text-gray-500 text-sm mt-1">So we know where to deliver. Takes 30 seconds.</p>
      </div>

      {/* Pin location button */}
      <button
        onClick={() => setShowMap(true)}
        className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
          pinLat ? "border-green-500 bg-green-50" : "border-dashed border-gray-300 hover:border-green-400"
        }`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${pinLat ? "bg-green-600" : "bg-gray-100"}`}>
          <Navigation size={18} className={pinLat ? "text-white" : "text-gray-500"} />
        </div>
        <div className="text-left">
          <p className={`text-sm font-semibold ${pinLat ? "text-green-700" : "text-gray-700"}`}>
            {pinLat ? "Location pinned ✓" : "Pin on map (optional)"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {pinLat ? `${pinLat.toFixed(4)}, ${pinLng?.toFixed(4)}` : "Helps with accurate delivery"}
          </p>
        </div>
      </button>

      {/* Address form */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {["home", "work", "other"].map((lbl) => (
            <button
              key={lbl}
              onClick={() => setForm(p => ({ ...p, label: lbl }))}
              className={`h-9 rounded-xl text-sm font-semibold capitalize transition-all ${
                form.label === lbl ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>

        {[
          { key: "line1", placeholder: "Street / Area / Colony *", required: true },
          { key: "line2", placeholder: "Landmark (optional)" },
          { key: "city",  placeholder: "City" },
          { key: "pincode", placeholder: "Pincode *", inputMode: "numeric" as const },
        ].map(({ key, placeholder, inputMode }) => (
          <input
            key={key}
            placeholder={placeholder}
            inputMode={inputMode}
            value={(form as Record<string, string>)[key]}
            onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
            className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition-all"
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onDone}
          className="h-12 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500"
        >
          {isCheckout ? "Skip, add at checkout" : "Skip for now"}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-12 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold disabled:opacity-50"
        >
          {saving ? "Saving…" : isCheckout ? "Save & Checkout →" : "Save Address"}
        </button>
      </div>
    </div>
  );
}

function DoneStep({ name, redirect, router }: { name: string; redirect: string; router: ReturnType<typeof useRouter> }) {
  const isCheckout = redirect.includes("checkout");
  useEffect(() => {
    track("signup", { method: "email_otp" });
    const t = setTimeout(() => { router.push(redirect); router.refresh(); }, 1800);
    return () => clearTimeout(t);
  }, [redirect, router]);

  return (
    <div className="flex flex-col items-center text-center py-8 space-y-5">
      <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center">
        <CheckCircle2 size={42} className="text-green-600" />
      </div>
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">All set, {name.split(" ")[0]}!</h1>
        <p className="text-gray-500 text-sm mt-2">{isCheckout ? "Taking you to checkout…" : "Taking you to the store…"}</p>
      </div>
      <div className="w-8 h-1 bg-green-200 rounded-full overflow-hidden">
        <div className="h-full bg-green-600 rounded-full animate-[grow_1.8s_ease-in-out_forwards]" />
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

type Step = "details" | "otp" | "done" | "address";

function RegisterContent() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/";

  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const validateDetails = useCallback(() => {
    if (!name.trim() || name.trim().length < 2) { toast.error("Enter your full name"); return false; }
    const ph = phone.replace(/\D/g, "");
    if (ph.length !== 10) { toast.error("Enter a valid 10-digit mobile number"); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Enter a valid email address"); return false; }
    return true;
  }, [name, phone, email]);

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
  }, [validateDetails, email]);

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
      const profileRes = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: `+91${phone.replace(/\D/g, "")}` }),
      });
      if (!profileRes.ok) {
        toast.error("Couldn't save your profile — you can update it later in Account.");
      }

      setStep("address");
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
        {(["details", "otp", "address", "done"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`rounded-full transition-all duration-300 ${
              step === s
                ? "w-6 h-2 bg-green-600"
                : i < (["details","otp","address","done"] as Step[]).indexOf(step)
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
                  <Link href={`/login${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`} className="text-green-600 font-semibold hover:underline">Sign in</Link>
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
                <div className={`relative flex items-center rounded-2xl border-2 bg-white transition-all duration-200 ${phoneFocused ? "border-green-400" : "border-gray-200"}`}>
                  <Phone size={17} className={`absolute left-4 ${phoneFocused ? "text-green-600" : "text-gray-400"}`} />
                  <div className="flex-1 relative pt-5 pb-2 pl-11 pr-4">
                    <label className={`absolute left-11 transition-all duration-200 pointer-events-none ${
                      phone || phoneFocused ? "top-2 text-[10px] font-semibold text-green-600 uppercase tracking-wider" : "top-1/2 -translate-y-1/2 text-sm text-gray-400"
                    }`}>Mobile Number</label>
                    <div className="flex items-center gap-2">
                      {(phone || phoneFocused) && <span className="text-sm font-semibold text-gray-500 shrink-0">+91</span>}
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        onFocus={() => setPhoneFocused(true)}
                        onBlur={() => setPhoneFocused(false)}
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
                <a href="/terms" className="text-green-600 font-medium hover:underline">Terms</a>
                {" "}&amp;{" "}
                <a href="/privacy" className="text-green-600 font-medium hover:underline">Privacy Policy</a>
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
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                  <span className="text-base shrink-0">📬</span>
                  <p className="text-xs font-semibold text-amber-800">
                    Didn&apos;t receive the OTP? Check your <span className="underline underline-offset-2">spam / junk</span> folder.
                  </p>
                </div>
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

          {/* ── Step 3: Address (location picker) ─────────────── */}
          {step === "address" && (
            <AddressStep
              userName={name.split(" ")[0]}
              userPhone={`+91${phone.replace(/\D/g, "")}`}
              redirect={redirect}
              onDone={() => {
                if (redirect !== "/") {
                  router.push(redirect);
                  router.refresh();
                } else {
                  setStep("done");
                }
              }}
            />
          )}

          {/* ── Step 4: Done ─────────────────────────────────── */}
          {step === "done" && (
            <DoneStep name={name} redirect={redirect} router={router} />
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
