"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
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

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-5">
        <AlertCircle size={30} className="text-red-500" />
      </div>
      <h2 className="text-xl font-extrabold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-gray-500 text-sm mb-6 max-w-xs leading-relaxed">
        {error.message?.includes("fetch") || error.message?.includes("network")
          ? "Check your internet connection and try again."
          : "An unexpected error occurred. We've been notified."}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-colors"
        >
          <RefreshCw size={14} /> Try Again
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
        >
          <Home size={14} /> Home
        </Link>
      </div>
    </div>
  );
}
