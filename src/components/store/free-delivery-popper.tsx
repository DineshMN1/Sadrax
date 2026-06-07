"use client";

import type { CSSProperties } from "react";

// Celebratory "free delivery" banner with a one-shot confetti pop.
export function FreeDeliveryPopper() {
  const colors = ["#16a34a", "#f59e0b", "#ec4899", "#3b82f6", "#a855f7", "#ef4444", "#14b8a6", "#eab308"];

  return (
    <div className="relative overflow-hidden bg-green-50 border border-green-100 rounded-2xl p-3.5 flex items-center gap-3">
      <span className="text-2xl inline-block" style={{ animation: "fdPop 0.5s ease-out both" }}>🎉</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-extrabold text-green-700">You got FREE delivery!</p>
        <p className="text-xs text-green-600/70 mt-0.5">No delivery charge on this order. Enjoy 💚</p>
      </div>

      {/* confetti burst, anchored to the emoji */}
      <div className="pointer-events-none absolute left-6 top-1/2">
        {colors.map((c, i) => {
          const a = (i / colors.length) * Math.PI * 2;
          const tx = Math.cos(a) * 56;
          const ty = Math.sin(a) * 56;
          return (
            <span
              key={i}
              className="absolute w-1.5 h-1.5 rounded-[2px]"
              style={{ background: c, ["--tx" as string]: `${tx}px`, ["--ty" as string]: `${ty}px`, animation: `fdConfetti 0.9s ease-out ${i * 0.03}s both` } as CSSProperties}
            />
          );
        })}
      </div>

      <style>{`
        @keyframes fdPop { 0%{transform:scale(0)} 60%{transform:scale(1.3) rotate(8deg)} 100%{transform:scale(1) rotate(0)} }
        @keyframes fdConfetti {
          0%   { opacity:1; transform:translate(0,0) scale(1); }
          100% { opacity:0; transform:translate(var(--tx),var(--ty)) scale(0.3); }
        }
      `}</style>
    </div>
  );
}
