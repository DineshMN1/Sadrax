import { cache } from "react";
import { db } from "@/lib/db";
import { storeSettings } from "@/lib/db/schema";
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, DELIVERY_PINCODES } from "@/lib/utils";

// Defaults fall back to the existing constants, so behaviour is unchanged
// until an admin actually sets a value in Store Settings.
export interface StoreSettings {
  storeOpen: boolean;
  openTime: string;
  closeTime: string;
  deliveryFee: number;             // paise
  freeDeliveryThreshold: number;   // paise
  deliveryEta: string;
  pincodes: string[];
  storeName: string;
  storeAddress: string;
  storePhone: string;
}

// Cached per request so multiple callers share one DB read.
export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  const rows = await db.select().from(storeSettings);
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, string>;
  const num = (v: string | undefined, d: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  };
  return {
    storeOpen: m.store_open !== "false",
    openTime: m.open_time || "08:00",
    closeTime: m.close_time || "21:00",
    deliveryFee: num(m.delivery_fee, DELIVERY_FEE),
    freeDeliveryThreshold: num(m.free_delivery_threshold, FREE_DELIVERY_THRESHOLD),
    deliveryEta: m.delivery_eta || "30–45 min",
    pincodes: (m.delivery_pincodes || DELIVERY_PINCODES.join(","))
      .split(",").map((s) => s.trim()).filter(Boolean),
    storeName: m.store_name || "Sadrax Grocery",
    storeAddress: m.store_address || "Sadras, Tamil Nadu",
    storePhone: m.store_phone || "",
  };
});

export function computeDeliveryFee(subtotal: number, s: StoreSettings): number {
  return subtotal >= s.freeDeliveryThreshold ? 0 : s.deliveryFee;
}

export function isServiceable(pincode: string, s: StoreSettings): boolean {
  return s.pincodes.includes(pincode.trim());
}

// Customer-safe subset exposed to the storefront client.
export function publicSettings(s: StoreSettings) {
  return {
    deliveryFee: s.deliveryFee,
    freeDeliveryThreshold: s.freeDeliveryThreshold,
    deliveryEta: s.deliveryEta,
    pincodes: s.pincodes,
    storeOpen: s.storeOpen,
    storeName: s.storeName,
    storePhone: s.storePhone,
  };
}
export type PublicSettings = ReturnType<typeof publicSettings>;
