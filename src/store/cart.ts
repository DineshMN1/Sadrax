"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { deliveryFeeFor } from "@/store/config";
import { track } from "@/lib/analytics";

export interface CartItem {
  id: number;
  variantIdx: number; // index into product.variants[]; 0 if no variants
  name: string;
  price: number; // paise
  mrp?: number;
  unit?: string;
  image?: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  discount: number; // paise

  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: number, variantIdx?: number) => void;
  updateQuantity: (id: number, quantity: number, variantIdx?: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;

  // computed
  itemCount: () => number;
  subtotal: () => number;
  deliveryFee: () => number;
  total: () => number;
}

const sameItem = (i: CartItem, id: number, variantIdx: number) =>
  i.id === id && i.variantIdx === variantIdx;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      discount: 0,

      addItem: (item) =>
        set((state) => {
          const vi = item.variantIdx ?? 0;
          track("add_to_cart", { product_id: item.id, name: item.name, price: item.price / 100 });
          const existing = state.items.find((i) => sameItem(i, item.id, vi));
          if (existing) {
            return {
              items: state.items.map((i) =>
                sameItem(i, item.id, vi) ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, variantIdx: vi, quantity: 1 }] };
        }),

      removeItem: (id, variantIdx = 0) =>
        set((state) => ({ items: state.items.filter((i) => !sameItem(i, id, variantIdx)) })),

      updateQuantity: (id, quantity, variantIdx = 0) =>
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => !sameItem(i, id, variantIdx)) };
          }
          return {
            items: state.items.map((i) =>
              sameItem(i, id, variantIdx) ? { ...i, quantity } : i
            ),
          };
        }),

      clearCart: () => set({ items: [], couponCode: null, discount: 0 }),

      applyCoupon: (code, discount) => set({ couponCode: code, discount }),
      removeCoupon: () => set({ couponCode: null, discount: 0 }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      deliveryFee: () => deliveryFeeFor(get().subtotal()),

      total: () =>
        Math.max(0, get().subtotal() + get().deliveryFee() - get().discount),
    }),
    {
      name: "sadrax-cart",
    }
  )
);
