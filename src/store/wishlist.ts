"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  ids: number[];
  toggle: (id: number) => void;
  has:    (id: number) => boolean;
  clear:  () => void;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set(state => ({
          ids: state.ids.includes(id)
            ? state.ids.filter(i => i !== id)
            : [...state.ids, id],
        })),
      has: (id) => get().ids.includes(id),
      clear: () => set({ ids: [] }),
    }),
    { name: "sadrax-wishlist" }
  )
);
