"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Tag, Copy, Check, Clock, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Coupon {
  id: number;
  code: string;
  label: string;
  description: string;
  expiresAt: string | null;
  type: string;
  value: number;
}

export default function OffersPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/coupons")
      .then(r => r.json())
      .then(d => setCoupons(d.coupons ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (coupon: Coupon) => {
    navigator.clipboard.writeText(coupon.code).catch(() => {});
    setCopiedId(coupon.id);
    toast.success(`${coupon.code} copied!`, { description: coupon.label });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-20 glass border-b border-gray-100/80 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
          <ChevronLeft size={20} className="text-gray-700" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Tag size={18} className="text-green-600" />
          <h1 className="text-lg font-extrabold text-gray-900">Offers & Coupons</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Loading */}
        {loading && (
          <>
            {[1, 2, 3].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}
          </>
        )}

        {/* Empty */}
        {!loading && coupons.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mb-5">
              <Tag size={36} className="text-green-300" />
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">No offers right now</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-xs">Check back soon — we add new coupons regularly!</p>
            <Link href="/" className="flex items-center gap-2 bg-linear-to-r from-green-600 to-emerald-600 text-white px-7 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-green-600/30">
              <ShoppingBag size={16} /> Shop Now
            </Link>
          </div>
        )}

        {/* Coupon cards */}
        {coupons.map(coupon => (
          <div key={coupon.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Dashed separator line */}
            <div className="flex items-stretch">
              {/* Left accent */}
              <div className="w-2 bg-linear-to-b from-green-500 to-emerald-500 shrink-0" />

              <div className="flex-1 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Code chip */}
                    <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 border-dashed rounded-xl px-3 py-1.5 mb-2">
                      <span className="text-sm font-extrabold text-green-700 font-mono tracking-widest">{coupon.code}</span>
                    </div>
                    <p className="text-base font-extrabold text-gray-900">{coupon.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{coupon.description}</p>
                    {coupon.expiresAt && (
                      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-orange-500 font-semibold">
                        <Clock size={10} />
                        Expires {formatDistanceToNow(new Date(coupon.expiresAt), { addSuffix: true })}
                      </div>
                    )}
                  </div>

                  {/* Copy button */}
                  <button
                    onClick={() => handleCopy(coupon)}
                    className="shrink-0 flex flex-col items-center gap-1 w-14 h-14 bg-green-50 hover:bg-green-100 border border-green-100 rounded-xl justify-center transition-all active:scale-95"
                  >
                    {copiedId === coupon.id
                      ? <Check size={18} className="text-green-600" />
                      : <Copy size={18} className="text-green-600" />}
                    <span className="text-[9px] font-bold text-green-600 uppercase tracking-wide">
                      {copiedId === coupon.id ? "Copied!" : "Copy"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {!loading && coupons.length > 0 && (
          <p className="text-center text-xs text-gray-400 py-2">
            Tap Copy, then paste at checkout
          </p>
        )}
      </div>
    </div>
  );
}
