"use client";

import { useEffect } from "react";
import { useStoreConfig } from "@/store/config";

// Hydrates the client store config from the DB-backed public settings once.
export function StoreConfigLoader() {
  const hydrate = useStoreConfig((s) => s.hydrate);
  useEffect(() => {
    let active = true;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (!active || !d) return;
        hydrate({
          deliveryFee: d.deliveryFee,
          freeDeliveryThreshold: d.freeDeliveryThreshold,
          deliveryEta: d.deliveryEta,
          pincodes: Array.isArray(d.pincodes) ? d.pincodes : undefined,
          storeOpen: d.storeOpen,
          storeName: d.storeName,
          storePhone: d.storePhone,
        });
      })
      .catch(() => { /* keep defaults */ });
    return () => { active = false; };
  }, [hydrate]);
  return null;
}
