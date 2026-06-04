"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RecentProduct {
  id: number;
  name: string;
  price: number;
  mrp?: number | null;
  unit?: string | null;
  images?: string[];
  stock: number;
}

interface RecentlyViewedState {
  items: RecentProduct[];
  add:   (p: RecentProduct) => void;
  clear: () => void;
}

const MAX = 10;

export const useRecentlyViewed = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      items: [],
      add: (p) =>
        set(state => {
          const filtered = state.items.filter(i => i.id !== p.id);
          return { items: [p, ...filtered].slice(0, MAX) };
        }),
      clear: () => set({ items: [] }),
    }),
    { name: "sadrax-recently-viewed" }
  )
);
