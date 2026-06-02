"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

const slides = [
  {
    emoji: "🛒",
    title: "Sadras & Kalpakam's\nFresh Grocery",
    desc: "Order fresh groceries from your trusted local store — delivered to your door.",
    bg: "from-green-50 to-emerald-100",
    accent: "bg-green-600",
  },
  {
    emoji: "⚡",
    title: "2-Tap Ordering",
    desc: "Find what you need with search, tap Add, and checkout in seconds. No friction, no fuss.",
    bg: "from-blue-50 to-sky-100",
    accent: "bg-blue-600",
  },
  {
    emoji: "🚀",
    title: "Fast Local Delivery",
    desc: "We know every street in Sadras. Quick delivery, every time — even for small orders.",
    bg: "from-orange-50 to-amber-100",
    accent: "bg-orange-500",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("sadrax-onboarded")) {
      router.replace("/");
    }
  }, [router]);

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem("sadrax-onboarded", "1");
      router.replace("/");
    }
  };

  const handleSkip = () => {
    localStorage.setItem("sadrax-onboarded", "1");
    router.replace("/");
  };

  const slide = slides[step];

  return (
    <div className={`min-h-screen flex flex-col bg-linear-to-br ${slide.bg} transition-all duration-500`}>
      {/* Skip */}
      <div className="flex justify-end px-6 pt-6">
        <button onClick={handleSkip} className="text-sm font-semibold text-gray-500 hover:text-gray-700 py-2 px-3">
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="text-8xl mb-8 drop-shadow-sm animate-bounce-once">{slide.emoji}</div>
        <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-4 whitespace-pre-line">
          {slide.title}
        </h1>
        <p className="text-gray-600 text-base leading-relaxed max-w-xs">{slide.desc}</p>
      </div>

      {/* Bottom controls */}
      <div className="px-8 pb-12 space-y-6">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === step ? `w-6 ${slide.accent}` : "w-2 bg-gray-300"}`}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleNext}
          className={`w-full flex items-center justify-center gap-2 h-14 ${slide.accent} text-white text-base font-bold rounded-2xl shadow-lg active:scale-[0.97] transition-transform`}
        >
          {step < slides.length - 1 ? (
            <>Continue <ChevronRight size={20} /></>
          ) : (
            "Start Shopping 🛒"
          )}
        </button>
      </div>
    </div>
  );
}
