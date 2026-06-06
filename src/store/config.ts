"use client";

import { create } from "zustand";
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, DELIVERY_PINCODES } from "@/lib/utils";

// Mirror of the public store settings, hydrated once from /api/settings by
// <StoreConfigLoader/>. Defaults to the build-time constants so the UI is
// correct before the fetch resolves and if the request fails.
interface StoreConfig {
  deliveryFee: number;
  freeDeliveryThreshold: number;
  deliveryEta: string;
  pincodes: string[];
  storeOpen: boolean;
  storeName: string;
  storePhone: string;
  loaded: boolean;
  hydrate: (c: Partial<StoreConfig>) => void;
}

export const useStoreConfig = create<StoreConfig>((set) => ({
  deliveryFee: DELIVERY_FEE,
  freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
  deliveryEta: "30–45 min",
  pincodes: DELIVERY_PINCODES,
  storeOpen: true,
  storeName: "Sadrax Grocery",
  storePhone: "",
  loaded: false,
  hydrate: (c) => set({ ...c, loaded: true }),
}));

// Non-reactive read for use inside other stores (e.g. the cart).
export function deliveryFeeFor(subtotal: number): number {
  const c = useStoreConfig.getState();
  return subtotal >= c.freeDeliveryThreshold ? 0 : c.deliveryFee;
}
