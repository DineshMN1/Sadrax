"use client";

import { useEffect, useState } from "react";
import { Download, Share, MoreVertical, X, Smartphone, CheckCircle2 } from "lucide-react";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/utils";

type InstallState = "idle" | "android" | "ios" | "installed";

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !(window as Window & { MSStream?: unknown }).MSStream;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    !!(navigator as Navigator & { standalone?: boolean }).standalone
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let deferredPrompt: any = null;

/* Shared wrapper — lifts above cart bar when items exist */
function BannerWrapper({ children, expanded = false }: { children: React.ReactNode; expanded?: boolean }) {
  const hasCart = useCart(s => s.itemCount() > 0);
  return (
    <div className={cn(
      "fixed left-4 right-4 z-40 animate-slide-up transition-all duration-300",
      "md:left-auto md:right-6 md:w-80 md:bottom-6",
      // Mobile: lift above cart bar when visible
      hasCart ? "bottom-44" : "bottom-22",
    )}>
      {children}
    </div>
  );
}

export function PWAInstallBanner() {
  const [state, setState]           = useState<InstallState>("idle");
  const [dismissed, setDismiss]     = useState(false);
  const [showIOSSteps, setIOSSteps] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("sadrax_pwa_dismiss")) { setDismiss(true); return; }
    if (isStandalone()) { setState("installed"); return; }

    if (isIOS()) { setState("ios"); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (e: any) => {
      e.preventDefault();
      deferredPrompt = e;
      setState("android");
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setState("installed");
      deferredPrompt = null;
    });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setState("installed");
    deferredPrompt = null;
  };

  const dismiss = () => {
    setDismiss(true);
    localStorage.setItem("sadrax_pwa_dismiss", "1");
  };

  if (dismissed || state === "idle" || state === "installed") return null;

  /* ── Android / Chrome / Edge: one-tap install ── */
  if (state === "android") {
    return (
      <BannerWrapper>
        <div className="bg-white border border-gray-100 rounded-2xl shadow-xl shadow-black/10 p-4 flex items-center gap-3">
          <div className="w-11 h-11 bg-linear-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm shadow-green-500/30">
            <span className="text-xl">🛒</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold text-gray-900">Install Sadrax</p>
            <p className="text-xs text-gray-400 mt-0.5">Add to home screen for faster access</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm shadow-green-600/30"
            >
              <Download size={12} />
              Install
            </button>
            <button onClick={dismiss} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>
      </BannerWrapper>
    );
  }

  /* ── iOS Safari ── */
  if (state === "ios") {
    if (!showIOSSteps) {
      return (
        <BannerWrapper>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-xl shadow-black/10 p-4 flex items-center gap-3">
            <div className="w-11 h-11 bg-linear-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm shadow-green-500/30">
              <span className="text-xl">🛒</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-gray-900">Install Sadrax</p>
              <p className="text-xs text-gray-400 mt-0.5">Add to your iPhone home screen</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIOSSteps(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm shadow-green-600/30"
              >
                <Smartphone size={12} />
                How to
              </button>
              <button onClick={dismiss} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>
        </BannerWrapper>
      );
    }

    /* iOS expanded step-by-step */
    return (
      <BannerWrapper expanded>
        <div className="bg-white border border-gray-100 rounded-2xl shadow-xl shadow-black/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-extrabold text-gray-900">Add to Home Screen</p>
            <button onClick={dismiss} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
              <X size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {[
              {
                icon: <Share size={15} className="text-blue-500" />,
                bg: "bg-blue-50",
                text: <>Tap the <span className="font-bold">Share ↑</span> button at the bottom of Safari</>,
              },
              {
                icon: <MoreVertical size={15} className="text-gray-600" />,
                bg: "bg-gray-100",
                text: <>Scroll down and tap <span className="font-bold">&quot;Add to Home Screen&quot;</span></>,
              },
              {
                icon: <CheckCircle2 size={15} className="text-green-600" />,
                bg: "bg-green-50",
                text: <>Tap <span className="font-bold">&quot;Add&quot;</span> — Sadrax appears on your home screen!</>,
              },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-8 h-8 ${step.bg} rounded-xl flex items-center justify-center shrink-0 mt-0.5`}>
                  {step.icon}
                </div>
                <p className="text-xs text-gray-700 leading-relaxed pt-1.5">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </BannerWrapper>
    );
  }

  return null;
}

/* ── Small inline button for account page / desktop sidebar ── */
export function PWAInstallButton({ className }: { className?: string }) {
  const [state, setState] = useState<"idle" | "ready" | "installed">("idle");

  useEffect(() => {
    if (isStandalone()) { setState("installed"); return; }
    if (deferredPrompt) { setState("ready"); }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (e: any) => { e.preventDefault(); deferredPrompt = e; setState("ready"); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (state === "installed") {
    return (
      <span className={cn("flex items-center gap-1.5 text-xs font-semibold text-green-600", className)}>
        <CheckCircle2 size={13} /> Installed
      </span>
    );
  }

  if (state !== "ready") return null;

  return (
    <button
      onClick={async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") setState("installed");
        deferredPrompt = null;
      }}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 bg-green-50 border border-green-100",
        "hover:bg-green-100 text-green-700 text-xs font-bold rounded-xl transition-colors",
        className
      )}
    >
      <Download size={13} />
      Install App
    </button>
  );
}
