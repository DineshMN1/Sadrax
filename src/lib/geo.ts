"use client";

// Lightweight geolocation helper used during checkout. The prompt is optional —
// if the customer declines, callers continue without coordinates.

export interface Coords { lat: number; lng: number }

const CACHE_KEY = "sadrax_geo";

export function getCachedCoords(): Coords | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Coords) : null;
  } catch {
    return null;
  }
}

// Request the browser location. Resolves to coords on success, or null if
// unsupported / denied / timed out. Never rejects — callers can `await` safely.
export function requestCoords(timeoutMs = 8000): Promise<Coords | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(coords)); } catch { /* ignore */ }
        resolve(coords);
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 }
    );
  });
}

// Fire the permission prompt early (e.g. on "Proceed to checkout") without
// blocking navigation. Result is cached for the checkout page to reuse.
export function primeCoords(): void {
  void requestCoords();
}
