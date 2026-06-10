"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cart";
import { toast } from "sonner";
import { RotateCcw, Loader2 } from "lucide-react";

interface Props {
  orderId: number;
}

export function ReorderButton({ orderId }: Props) {
  const [loading, setLoading] = useState(false);
  const addItem = useCart(s => s.addItem);
  const router  = useRouter();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const res  = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (!res.ok || !data.items?.length) {
        toast.error("Couldn't load order items");
        return;
      }
      data.items.forEach((item: { id: number; variantIdx: number | null; name: string; price: number; unit?: string | null; image?: string | null; quantity: number }) => {
        for (let i = 0; i < item.quantity; i++) {
          addItem({
            id: item.id ?? 0,
            variantIdx: item.variantIdx ?? 0,
            name: item.name,
            price: item.price,
            unit: item.unit ?? undefined,
            image: item.image ?? undefined,
          });
        }
      });
      toast.success("Items added to cart!", { description: `${data.items.length} product${data.items.length !== 1 ? "s" : ""}` });
      router.push("/cart");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-1.5 h-8 px-3 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold rounded-xl border border-green-200 active:scale-95 transition-all disabled:opacity-60 shrink-0"
    >
      {loading
        ? <Loader2 size={12} className="animate-spin" />
        : <RotateCcw size={12} />}
      Reorder
    </button>
  );
}
