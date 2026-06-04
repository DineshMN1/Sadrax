"use client";

import { useEffect, useState } from "react";
import { Navigation, AlertTriangle, X, CheckCircle2, Loader2, MapPin } from "lucide-react";

type State = "idle" | "requesting" | "granted" | "denied" | "unsupported";

function getBrowserHint(): { title: string; steps: string[] } {
  if (typeof navigator === "undefined") return { title: "", steps: [] };
  const ua = navigator.userAgent.toLowerCase();

  if (/iphone|ipad/.test(ua)) {
    return {
      title: "Enable in iPhone Settings",
      steps: [
        "Open Settings → Safari",
        "Tap 'Location' → select 'Allow'",
        "Refresh this page",
      ],
    };
  }
  if (/android/.test(ua) && /chrome/.test(ua)) {
    return {
      title: "Enable in Chrome",
      steps: [
        "Tap the lock icon 🔒 in the address bar",
        "Tap 'Permissions' → Location → Allow",
        "Refresh this page",
      ],
    };
  }
  if (/firefox/.test(ua)) {
    return {
      title: "Enable in Firefox",
      steps: [
        "Tap the lock icon in the address bar",
        "Tap 'Site information' → Location → Allow",
      ],
    };
  }
  // Desktop Chrome / Edge / default
  return {
    title: "Enable in your browser",
    steps: [
      "Click the lock icon 🔒 in the address bar",
      "Click 'Site settings' → Location → Allow",
      "Refresh this page",
    ],
  };
}

export function LocationBanner() {
  const [state, setState]       = useState<State>("idle");
  const [dismissed, setDismiss] = useState(false);
  const [area, setArea]         = useState<string | null>(null);

  /* Reverse-geocode a lat/lng to suburb/city using Nominatim (free, no key needed) */
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      const addr = data?.address;
      setArea(
        addr?.suburb || addr?.neighbourhood || addr?.village ||
        addr?.town   || addr?.city          || "Your area"
      );
    } catch { /* silently ignore */ }
  };

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState("unsupported");
      return;
    }
    if (localStorage.getItem("sadrax_loc_dismiss")) {
      setDismiss(true);
      return;
    }

    /* Use Permissions API to read current state without triggering a prompt */
    navigator.permissions
      ?.query({ name: "geolocation" as PermissionName })
      .then(result => {
        const sync = () => {
          if (result.state === "granted") {
            setState("granted");
            navigator.geolocation.getCurrentPosition(p =>
              reverseGeocode(p.coords.latitude, p.coords.longitude)
            );
          } else if (result.state === "denied") {
            setState("denied");
          } else {
            setState("idle"); // "prompt" — don't auto-ask; let the user tap Allow
          }
        };
        sync();
        result.onchange = sync;
      })
      .catch(() => setState("idle")); // Permissions API not available (some iOS)
  }, []);

  const requestLocation = () => {
    setState("requesting");
    navigator.geolocation.getCurrentPosition(
      pos => {
        setState("granted");
        reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      },
      err => setState(err.code === 1 ? "denied" : "idle"),
      { timeout: 10_000, maximumAge: 60_000 }
    );
  };

  const dismiss = () => {
    setDismiss(true);
    localStorage.setItem("sadrax_loc_dismiss", "1");
  };

  /* ── Granted: show detected area (non-blocking, no dismiss) ── */
  if (state === "granted" && area) {
    return (
      <div className="mx-4 mt-3 flex items-center gap-2 px-3.5 py-2.5 bg-green-50 border border-green-100 rounded-2xl animate-slide-up">
        <CheckCircle2 size={14} className="text-green-600 shrink-0" />
        <p className="text-xs font-semibold text-green-700 flex-1 min-w-0 truncate">
          Delivering to <span className="font-extrabold">{area}</span>
        </p>
        <MapPin size={12} className="text-green-500 shrink-0" />
      </div>
    );
  }

  if (dismissed || state === "idle" || state === "unsupported" || state === "granted") return null;

  /* ── Prompt: ask user to allow location ── */
  if (state === "requesting" || (state !== "denied" && state !== "idle")) {
    return (
      <div className="mx-4 mt-3 bg-blue-50 border border-blue-200 rounded-2xl p-3.5 flex items-center gap-3 animate-slide-up shadow-sm shadow-blue-500/10">
        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/30">
          {state === "requesting"
            ? <Loader2 size={18} className="text-white animate-spin" />
            : <Navigation size={18} className="text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-blue-900">Allow location access</p>
          <p className="text-xs text-blue-600 mt-0.5">We use it to show accurate delivery info</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={requestLocation}
            disabled={state === "requesting"}
            className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl disabled:opacity-60 transition-colors"
          >
            Allow
          </button>
          <button onClick={dismiss} className="w-7 h-7 flex items-center justify-center text-blue-400 hover:text-blue-600 transition-colors rounded-lg">
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  /* ── Denied: browser-specific instructions ── */
  if (state === "denied") {
    const hint = getBrowserHint();
    return (
      <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 animate-slide-up shadow-sm shadow-amber-500/10">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={15} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold text-amber-900">Location blocked</p>
            {hint.title && <p className="text-xs font-bold text-amber-700 mt-1.5">{hint.title}:</p>}
            <ol className="mt-1 space-y-1">
              {hint.steps.map((s, i) => (
                <li key={i} className="text-xs text-amber-700 flex gap-1.5">
                  <span className="font-bold shrink-0 text-amber-500">{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            <button
              onClick={requestLocation}
              className="mt-3 flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl transition-colors"
            >
              <Navigation size={12} /> Try again after enabling
            </button>
          </div>
          <button onClick={dismiss} className="w-7 h-7 flex items-center justify-center text-amber-400 hover:text-amber-600 shrink-0 rounded-lg transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
