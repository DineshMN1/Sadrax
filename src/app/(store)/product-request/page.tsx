"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Send, CheckCircle2, Clock, Plus, Package } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Request = {
  id: number;
  productName: string;
  note: string | null;
  status: string;
  createdAt: string;
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:  { label: "Pending",  color: "bg-amber-50 text-amber-700 border-amber-200"  },
  added:    { label: "Added ✓",  color: "bg-green-50 text-green-700 border-green-200"  },
  declined: { label: "Declined", color: "bg-red-50   text-red-700   border-red-200"    },
};

export default function ProductRequestPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [productName, setProductName] = useState("");
  const [note, setNote]               = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [history, setHistory]         = useState<Request[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res  = await fetch("/api/product-requests");
      const data = await res.json();
      setHistory(data.requests ?? []);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (session) loadHistory();
  }, [session]);

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
          <Package size={28} className="text-green-600" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">Sign in to request products</h2>
        <p className="text-gray-500 text-sm mb-6 max-w-xs">
          Tell us what you&apos;re looking for — we&apos;ll add it to the store for you.
        </p>
        <Link
          href="/login"
          className="bg-linear-to-r from-green-600 to-emerald-600 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-green-600/30"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = productName.trim();
    if (!name) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/product-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName: name, note: note.trim() || undefined }),
      });
      if (res.ok) {
        setSubmitted(true);
        setProductName("");
        setNote("");
        loadHistory();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="md:max-w-2xl md:mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 glass border-b border-gray-100/80 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="text-lg font-extrabold text-gray-900">Request a Product</h1>
      </div>

      <div className="px-4 py-5 space-y-5">

        {/* Success state */}
        {submitted ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-3">
            <CheckCircle2 size={44} className="text-green-500 mx-auto" />
            <div>
              <h2 className="text-lg font-extrabold text-green-800">Thank you!</h2>
              <p className="text-sm text-green-700 mt-1 max-w-xs mx-auto">
                We&apos;ve received your request. We&apos;ll do our best to add it to the store soon!
              </p>
            </div>
            <button
              onClick={() => setSubmitted(false)}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-green-700 hover:text-green-800 transition-colors"
            >
              <Plus size={14} /> Request another product
            </button>
          </div>
        ) : (
          /* Request form */
          <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-4">
            <div>
              <p className="text-sm font-extrabold text-gray-900 mb-1">
                Can&apos;t find what you need?
              </p>
              <p className="text-xs text-gray-400">
                Tell us the product you&apos;re looking for and we&apos;ll try to add it to the store.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">
                  Product name <span className="text-red-500">*</span>
                </label>
                <input
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  placeholder="e.g. Amul Mozzarella Cheese 200g"
                  maxLength={200}
                  required
                  className="w-full h-11 px-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">
                  Additional details <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Brand, size, quantity or any other details..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm resize-none focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !productName.trim()}
              className="w-full flex items-center justify-center gap-2 h-12 bg-linear-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl shadow-sm shadow-green-600/30 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:pointer-events-none transition-all"
            >
              {submitting ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              ) : (
                <><Send size={15} /> Send Request</>
              )}
            </button>
          </form>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold text-gray-900">Your Requests</h2>
            {loadingHistory ? (
              <div className="space-y-2">
                {[1, 2].map(i => <div key={i} className="h-16 skeleton rounded-2xl" />)}
              </div>
            ) : (
              history.map(r => {
                const meta = STATUS_META[r.status] ?? STATUS_META.pending;
                return (
                  <div key={r.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm px-4 py-3 flex items-start gap-3">
                    <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                      <Package size={16} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{r.productName}</p>
                      {r.note && <p className="text-xs text-gray-400 mt-0.5 truncate">{r.note}</p>}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${meta.color}`}>
                          {meta.label}
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Clock size={9} />
                          {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
