"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Check } from "lucide-react";

const slides = [
  {
    emoji: "🛒",
    title: "நம்ம Sadras-ல\nகிரசரி",
    desc: "Order fresh groceries from your trusted local store — delivered straight to your door.",
    bg: "from-green-600 to-emerald-700",
    accent: "bg-white",
    accentText: "text-green-700",
  },
  {
    emoji: "⚡",
    title: "2 Taps to Order",
    desc: "Search, tap Add, checkout in seconds. No friction, no fuss — even small orders welcome.",
    bg: "from-blue-600 to-indigo-700",
    accent: "bg-white",
    accentText: "text-blue-700",
  },
  {
    emoji: "🚀",
    title: "Fast Local Delivery",
    desc: "We know every street in Sadras. Quick delivery, every time.",
    bg: "from-orange-500 to-amber-600",
    accent: "bg-white",
    accentText: "text-orange-600",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("sadrax-onboarded")) {
      router.replace("/");
    }
  }, [router]);

  const slide = slides[step];

  const goNext = () => {
    if (animating) return;
    if (step < slides.length - 1) {
      setAnimating(true);
      setTimeout(() => { setStep(s => s + 1); setAnimating(false); }, 200);
    } else {
      localStorage.setItem("sadrax-onboarded", "1");
      router.replace("/");
    }
  };

  const skip = () => {
    localStorage.setItem("sadrax-onboarded", "1");
    router.replace("/");
  };

  return (
    <div className={`min-h-screen flex flex-col bg-linear-to-br ${slide.bg} transition-all duration-500`}>
      {/* Skip */}
      <div className="flex justify-end px-6 pt-6">
        <button onClick={skip} className="text-sm font-semibold text-white/60 hover:text-white/90 py-2 px-3 transition-colors">
          Skip
        </button>
      </div>

      {/* Content */}
      <div
        className={`flex-1 flex flex-col items-center justify-center px-8 text-center transition-opacity duration-200 ${animating ? "opacity-0" : "opacity-100"}`}
      >
        <div className="text-8xl mb-8 drop-shadow-sm animate-float select-none">{slide.emoji}</div>
        <h1
          className="text-3xl font-extrabold text-white leading-tight mb-4 whitespace-pre-line"
          style={{ fontFamily: "var(--font-brand)", letterSpacing: "-0.02em" }}
        >
          {slide.title}
        </h1>
        <p className="text-white/75 text-base leading-relaxed max-w-xs">{slide.desc}</p>
      </div>

      {/* Bottom */}
      <div className="px-8 pb-14 space-y-6">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-white" : "w-2 bg-white/30"}`}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={goNext}
          className={`w-full flex items-center justify-center gap-2 h-14 ${slide.accent} ${slide.accentText} text-base font-extrabold rounded-2xl shadow-lg shadow-black/20 active:scale-[0.97] transition-all`}
        >
          {step < slides.length - 1 ? (
            <>Continue <ChevronRight size={20} /></>
          ) : (
            <><Check size={20} /> Start Shopping</>
          )}
        </button>
      </div>
    </div>
  );
}
