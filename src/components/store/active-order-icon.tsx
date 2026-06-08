"use client";

import { LottiePlayer } from "@/components/lottie-player";
import deliveryAnim from "@/lottie/delivery.json";

export function ActiveOrderIcon({ status, emoji }: { status: string; emoji: string }) {
  if (status === "out_for_delivery") {
    return <div className="w-12 h-12 shrink-0"><LottiePlayer animationData={deliveryAnim} loop className="w-full h-full" /></div>;
  }
  return <span className="text-2xl shrink-0">{emoji}</span>;
}
