"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error("[Admin Error]", error); }, [error]);
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-6">
      <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
        <AlertTriangle size={26} className="text-red-500" />
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-1">Page error</h2>
      <p className="text-sm text-gray-500 mb-5">{error.message || "Something went wrong loading this page."}</p>
      <button onClick={reset} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl">
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  );
}
