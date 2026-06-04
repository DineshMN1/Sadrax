"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  const [phase, setPhase] = useState<"hidden" | "visible" | "fading" | "done">("hidden");

  useEffect(() => {
    if (sessionStorage.getItem("sadrax_splash")) {
      setPhase("done");
      return;
    }
    sessionStorage.setItem("sadrax_splash", "1");

    setPhase("visible");
    const fadeTimer = setTimeout(() => setPhase("fading"), 2400);
    const doneTimer = setTimeout(() => setPhase("done"),  2900);
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer); };
  }, []);

  if (phase === "hidden" || phase === "done") return null;

  return (
    <div
      className={`
        fixed inset-0 z-200 flex flex-col items-center justify-center
        bg-linear-to-br from-green-600 via-green-700 to-emerald-800
        transition-opacity duration-500
        ${phase === "fading" ? "opacity-0 pointer-events-none" : "opacity-100"}
      `}
    >
      {/* Background texture */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-green-400/20 rounded-full blur-3xl" />

      {/* Brand name */}
      <div className="text-center animate-bounce-in">
        <h1
          className="text-white select-none"
          style={{
            fontFamily: "var(--font-brand)",
            fontSize: "clamp(4rem, 16vw, 6.5rem)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            textShadow: "0 2px 32px rgba(0,0,0,0.15)",
          }}
        >
          Sadrax
        </h1>
      </div>

      {/* Tamil tagline */}
      <div className="mt-5 animate-slide-up [animation-delay:200ms]">
        <p
          className="text-green-100 text-center"
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: "clamp(1.2rem, 4.5vw, 1.5rem)",
            fontWeight: 500,
            letterSpacing: "0.01em",
          }}
        >
          நம்ம ஊரோட கிரசரி
        </p>
      </div>

      {/* Progress bar */}
      <div className="mt-14 animate-slide-up [animation-delay:400ms]">
        <div className="w-48 h-px bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/70 rounded-full animate-[grow_2.4s_ease-out_forwards]" />
        </div>
      </div>

      {/* Footer */}
      <p
        className="mt-5 text-green-200/60 text-center animate-slide-up [animation-delay:600ms]"
        style={{
          fontFamily: "system-ui, sans-serif",
          fontSize: "clamp(0.75rem, 2.5vw, 0.85rem)",
          letterSpacing: "0.12em",
        }}
      >
        புதுசா &nbsp;·&nbsp; நம்ம ஊரு &nbsp;·&nbsp; வேகமா
      </p>
    </div>
  );
}
