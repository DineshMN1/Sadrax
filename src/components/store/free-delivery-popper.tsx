"use client";

import { LottiePlayer } from "@/components/lottie-player";
import popper from "@/lottie/popper.json";

// Celebratory "free delivery" banner with a Lottie confetti popper.
export function FreeDeliveryPopper() {
  return (
    <div className="relative overflow-hidden bg-green-50 border border-green-100 rounded-2xl p-3.5 flex items-center gap-3">
      <div className="w-11 h-11 shrink-0">
        <LottiePlayer animationData={popper} loop className="w-full h-full" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-extrabold text-green-700">You got FREE delivery!</p>
        <p className="text-xs text-green-600/70 mt-0.5">No delivery charge on this order. Enjoy 💚</p>
      </div>
      {/* full-width confetti burst across the banner */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <LottiePlayer animationData={popper} loop className="w-full h-full" />
      </div>
    </div>
  );
}
