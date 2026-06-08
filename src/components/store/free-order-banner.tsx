"use client";

import { LottiePlayer } from "@/components/lottie-player";
import popper from "@/lottie/popper.json";

// Celebratory banner for an order the store made FREE ("on the house"),
// showing the staff note. Uses the Lottie confetti popper (no raw emoji so it
// survives any build locale).
export function FreeOrderBanner({ note }: { note: string }) {
  return (
    <div className="relative overflow-hidden bg-green-50 border border-green-200 rounded-2xl p-4 shadow-sm">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <LottiePlayer animationData={popper} loop className="w-full h-full" />
      </div>
      <div className="relative flex items-center gap-3">
        <div className="w-14 h-14 shrink-0">
          <LottiePlayer animationData={popper} loop className="w-full h-full" />
        </div>
        <div className="min-w-0">
          <p className="text-base font-extrabold text-green-700">Your order is FREE!</p>
          <p className="text-sm text-green-600 mt-0.5 leading-snug">{note}</p>
        </div>
      </div>
    </div>
  );
}
