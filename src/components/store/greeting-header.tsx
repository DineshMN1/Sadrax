"use client";

import dynamic from "next/dynamic";

function StaticFallback() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div>
          <span className="text-sm font-extrabold text-gray-900 leading-none block">Sadrax</span>
          <span className="text-[10px] font-semibold text-gray-400 leading-none">by Malik Stores</span>
        </div>
      </div>
      <div className="w-14 h-14 bg-gray-100 rounded-full animate-pulse shrink-0" />
    </div>
  );
}

const GreetingInner = dynamic(() => import("./greeting-inner").then(m => ({ default: m.GreetingInner })), {
  ssr: false,
  loading: () => <StaticFallback />,
});

export function GreetingHeader() {
  return <GreetingInner />;
}
