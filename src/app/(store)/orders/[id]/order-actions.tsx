"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cart";
import { toast } from "sonner";
import { RotateCcw, X, Loader2 } from "lucide-react";

interface OrderItem {
  id: number;
  name: string;
  price: number;
  unit?: string;
  image?: string;
  quantity: number;
}

interface Props {
  orderId: number;
  orderNumber: string;
  status: string;
  items: OrderItem[];
}

export function OrderActions({ orderId, orderNumber, status, items }: Props) {
  const router  = useRouter();
  const addItem = useCart(s => s.addItem);
  const [cancelling, setCancelling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReorder = () => {
    items.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        addItem({ id: item.id, name: item.name, price: item.price, unit: item.unit, image: item.image });
      }
    });
    toast.success("Items added to cart!", { description: `${items.length} product${items.length !== 1 ? "s" : ""}` });
    router.push("/cart");
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not cancel order");
        return;
      }
      toast.success("Order cancelled");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setCancelling(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="flex gap-2">
      {/* Reorder */}
      <button
        onClick={handleReorder}
        className="flex-1 flex items-center justify-center gap-2 h-11 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-2xl transition-colors shadow-sm shadow-green-600/30"
      >
        <RotateCcw size={15} />
        Reorder
      </button>

      {/* Cancel — only for pending orders */}
      {status === "pending" && !showConfirm && (
        <button
          onClick={() => setShowConfirm(true)}
          className="flex items-center justify-center gap-2 px-4 h-11 bg-white border border-red-200 text-red-500 text-sm font-bold rounded-2xl hover:bg-red-50 transition-colors"
        >
          <X size={15} />
          Cancel
        </button>
      )}

      {status === "pending" && showConfirm && (
        <div className="flex gap-2 flex-1">
          <button
            onClick={() => setShowConfirm(false)}
            className="flex-1 h-11 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-2xl hover:bg-gray-50 transition-colors"
          >
            Keep
          </button>
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="flex-1 flex items-center justify-center gap-1.5 h-11 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-2xl transition-colors disabled:opacity-60"
          >
            {cancelling ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
            Confirm Cancel
          </button>
        </div>
      )}
    </div>
  );
}
