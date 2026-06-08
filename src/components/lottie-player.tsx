"use client";

import dynamic from "next/dynamic";
import type { CSSProperties } from "react";

// lottie-react wraps lottie-web (browser-only) — load client-side + code-split.
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export function LottiePlayer({
  animationData,
  loop = true,
  className,
  style,
  onComplete,
}: {
  animationData: unknown;
  loop?: boolean;
  className?: string;
  style?: CSSProperties;
  onComplete?: () => void;
}) {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Lottie animationData={animationData as any} loop={loop} className={className} style={style} onComplete={onComplete} />
  );
}
