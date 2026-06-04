"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Download, X, Share, MoreVertical, CheckCircle2, BellOff } from "lucide-react";

type Step = "idle" | "install-android" | "install-ios" | "notifications" | "notif-denied" | "done";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches ||
    !!(navigator as Navigator & { standalone?: boolean }).standalone;
}
function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !(window as Window & { MSStream?: unknown }).MSStream;
}

// Module-level deferred prompt — captured before component mounts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _deferredPrompt: any = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    _deferredPrompt = e;
  });
}

const SESSION_KEY = "sadrax_prompts_shown";

export function SessionPrompts() {
  const [step, setStep]         = useState<Step>("idle");
  const [visible, setVisible]   = useState(false);
  const [closing, setClosing]   = useState(false);

  const close = useCallback((next: Step = "done") => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setVisible(false);
      setStep(next);
    }, 300);
  }, []);

  useEffect(() => {
    // Only run once per browser session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    // Small delay so page loads first
    const t = setTimeout(() => {
      if (isStandalone()) {
        // Already installed — only ask for notification permission
        if ("Notification" in window && Notification.permission === "default") {
          setStep("notifications");
          setVisible(true);
        }
      } else if (isIOS()) {
        setStep("install-ios");
        setVisible(true);
      } else if (_deferredPrompt) {
        setStep("install-android");
        setVisible(true);
      } else if ("Notification" in window && Notification.permission === "default") {
        setStep("notifications");
        setVisible(true);
      }
      sessionStorage.setItem(SESSION_KEY, "1");
    }, 3000);

    return () => clearTimeout(t);
  }, []);

  // After install/skip → check if we should show notification prompt
  const handleAfterInstall = useCallback(() => {
    if ("Notification" in window && Notification.permission === "default") {
      setTimeout(() => { setStep("notifications"); setVisible(true); }, 400);
    } else {
      close("done");
    }
  }, [close]);

  const handleInstallAndroid = async () => {
    if (!_deferredPrompt) return;
    _deferredPrompt.prompt();
    const { outcome } = await _deferredPrompt.userChoice;
    _deferredPrompt = null;
    close();
    if (outcome === "accepted") handleAfterInstall();
  };

  const handleRequestNotifications = useCallback(async () => {
    if (!("Notification" in window)) { close("done"); return; }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await subscribeForPush();
      close("done");
    } else {
      close("notif-denied");
    }
  }, [close]);

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-90 transition-opacity duration-300 ${closing ? "opacity-0" : "opacity-100"}`}
        onClick={() => close()}
      />

      {/* Bottom sheet */}
      <div className={`
        fixed bottom-0 left-0 right-0 z-91 max-w-lg mx-auto
        bg-white rounded-t-3xl shadow-2xl
        transition-transform duration-300 ease-out
        ${closing ? "translate-y-full" : "translate-y-0"}
      `}>
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <button
          onClick={() => close()}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="px-6 pt-3 pb-8 space-y-5">
          {/* ── Android install ── */}
          {step === "install-android" && (
            <>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-linear-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30 text-2xl shrink-0">
                  🛒
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900">Install Sadrax</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Faster ordering from your home screen</p>
                </div>
              </div>
              <ul className="space-y-2">
                {["Opens instantly — no browser needed", "Get order notifications", "Works offline for browsing"].map(t => (
                  <li key={t} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 size={15} className="text-green-500 shrink-0" /> {t}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleInstallAndroid}
                className="w-full flex items-center justify-center gap-2 h-13 bg-linear-to-r from-green-600 to-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-green-600/30 active:scale-[0.98] transition-all"
              >
                <Download size={18} /> Install App
              </button>
              <button onClick={() => close()} className="w-full text-center text-sm text-gray-400 py-1 hover:text-gray-600 transition-colors">
                Maybe later
              </button>
            </>
          )}

          {/* ── iOS install instructions ── */}
          {step === "install-ios" && (
            <>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-linear-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30 text-2xl shrink-0">
                  🛒
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900">Add to Home Screen</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Install Sadrax on your iPhone</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { icon: <Share size={16} className="text-blue-500" />, bg: "bg-blue-50", text: <>Tap <strong>Share ↑</strong> at the bottom of Safari</> },
                  { icon: <MoreVertical size={16} className="text-gray-600" />, bg: "bg-gray-100", text: <>Scroll and tap <strong>"Add to Home Screen"</strong></> },
                  { icon: <CheckCircle2 size={16} className="text-green-600" />, bg: "bg-green-50", text: <>Tap <strong>"Add"</strong> — Sadrax appears on your home screen</> },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-8 h-8 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>{s.icon}</div>
                    <p className="text-sm text-gray-700 pt-1.5 leading-relaxed">{s.text}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => { close(); handleAfterInstall(); }}
                className="w-full text-center text-sm text-gray-400 py-1 hover:text-gray-600 transition-colors">
                Done / Skip
              </button>
            </>
          )}

          {/* ── Notification permission ── */}
          {step === "notifications" && (
            <>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                  <Bell size={26} className="text-white" fill="white" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900">Get Order Updates</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Know the moment your order is ready</p>
                </div>
              </div>
              <ul className="space-y-2">
                {["Order accepted & out for delivery alerts", "Delivered notification", "No spam — only your order updates"].map(t => (
                  <li key={t} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 size={15} className="text-blue-500 shrink-0" /> {t}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleRequestNotifications}
                className="w-full flex items-center justify-center gap-2 h-13 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all"
              >
                <Bell size={18} fill="white" /> Allow Notifications
              </button>
              <button onClick={() => close()} className="w-full text-center text-sm text-gray-400 py-1 hover:text-gray-600 transition-colors">
                Not now
              </button>
            </>
          )}

          {/* ── Notifications denied — instructions ── */}
          {step === "notif-denied" && (
            <>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0">
                  <BellOff size={26} className="text-amber-500" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-gray-900">Notifications Blocked</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Enable them to get order updates</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3.5 text-xs text-amber-800 leading-relaxed">
                <p className="font-bold mb-1">To enable:</p>
                <p>Tap the <strong>lock icon 🔒</strong> in your browser address bar → <strong>Notifications</strong> → <strong>Allow</strong> → refresh the page.</p>
              </div>
              <button onClick={() => close()} className="w-full text-center text-sm text-gray-400 py-1">
                Got it
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Subscribe browser to push ── */
async function subscribeForPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) return;

  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    });

    const { endpoint, keys } = sub.toJSON() as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint, p256dh: keys.p256dh, auth: keys.auth }),
    });
  } catch (err) {
    console.warn("Push subscribe failed:", err);
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding   = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64    = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData   = window.atob(base64);
  const outputArr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArr[i] = rawData.charCodeAt(i);
  return outputArr;
}
