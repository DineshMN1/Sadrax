"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ORDER_STATUSES, STATUS_LABELS, type OrderStatus } from "@/lib/utils";

const STATUS_FLOW: OrderStatus[] = [
  "accepted",
  "packed",
  "out_for_delivery",
  "delivered",
  "rejected",
];

const STATUS_STYLES: Record<string, string> = {
  accepted:         "bg-blue-600 hover:bg-blue-700",
  packed:           "bg-indigo-600 hover:bg-indigo-700",
  out_for_delivery: "bg-orange-500 hover:bg-orange-600",
  delivered:        "bg-green-600 hover:bg-green-700",
  rejected:         "bg-red-500 hover:bg-red-600",
};

interface Props {
  orderId: number;
  currentStatus: string;
  orderNumber: string;
}

export function AdminOrderActions({ orderId, currentStatus, orderNumber }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const updateStatus = async (status: OrderStatus) => {
    if (loading) return;
    setLoading(status);
    try {
      const res = await fetch(`/api/cord/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Order #${orderNumber} → ${STATUS_LABELS[status]}`);
      router.refresh();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setLoading(null);
    }
  };

  const isTerminal = ["delivered", "rejected", "cancelled"].includes(currentStatus);

  if (isTerminal) {
    return (
      <p className="text-sm text-gray-400">
        This order is <span className="font-semibold">{STATUS_LABELS[currentStatus as OrderStatus]}</span> — no further updates possible.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_FLOW.map(status => {
        const isCurrent = status === currentStatus;
        const style = STATUS_STYLES[status];
        return (
          <button
            key={status}
            onClick={() => updateStatus(status)}
            disabled={isCurrent || !!loading}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              isCurrent ? "ring-2 ring-offset-2 ring-gray-400 bg-gray-500" : style
            }`}
          >
            {loading === status ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Updating…
              </span>
            ) : (
              <>
                {isCurrent && "● "}
                {STATUS_LABELS[status]}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
