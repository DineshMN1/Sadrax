"use client";

import { useSession } from "@/lib/auth-client";
import { LottiePlayer } from "@/components/lottie-player";
import deliveryBikeAnim from "@/lottie/delivery-bike.json";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function GreetingInner() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0];

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div>
          {firstName ? (
            <>
              <p className="text-sm font-extrabold text-gray-900 leading-none">
                {getGreeting()}, {firstName} 👋
              </p>
              <p className="text-[10px] font-semibold text-gray-400 leading-none mt-1">
                Sadrax <span className="text-gray-300">by Malik Stores</span>
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-extrabold text-gray-900 leading-none">Sadrax</p>
              <p className="text-[10px] font-semibold text-gray-400 leading-none mt-1">by Malik Stores</p>
            </>
          )}
        </div>
      </div>
      <div className="w-14 h-14 shrink-0">
        <LottiePlayer animationData={deliveryBikeAnim} loop className="w-full h-full" />
      </div>
    </div>
  );
}
