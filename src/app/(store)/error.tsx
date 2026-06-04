"use client";

import { useEffect } from "react";
import { RefreshCw, Home, WifiOff, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Store Error]", error);
  }, [error]);

  const isNetwork = error.message?.includes("fetch") || error.message?.includes("network");

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-5 shadow-sm ${
        isNetwork ? "bg-blue-50" : "bg-red-50"
      }`}>
        {isNetwork
          ? <WifiOff size={34} className="text-blue-400" />
          : <AlertTriangle size={34} className="text-red-400" />}
      </div>
      <h2 className="text-xl font-extrabold text-gray-900 mb-2">
        {isNetwork ? "No connection" : "Something went wrong"}
      </h2>
      <p className="text-gray-500 text-sm mb-7 max-w-xs leading-relaxed">
        {isNetwork
          ? "Check your internet connection and try again."
          : "An unexpected error occurred. Our team has been notified."}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-green-600 to-emerald-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-green-600/25 hover:shadow-xl transition-all active:scale-95"
        >
          <RefreshCw size={14} /> Try Again
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-2xl hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Home size={14} /> Home
        </Link>
      </div>
    </div>
  );
}
