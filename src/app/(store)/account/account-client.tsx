"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { Package, MapPin, LogOut, ChevronRight, Phone, Heart, Bell, Navigation, Headphones, Repeat } from "lucide-react";
import { toast } from "sonner";
import { PWAInstallButton } from "@/components/store/pwa-install-banner";
import { LottiePlayer } from "@/components/lottie-player";
import signInAnim from "@/lottie/sign-in.json";

const STORE_PHONE    = process.env.NEXT_PUBLIC_STORE_PHONE ?? "9876543210";
const VAPID_KEY      = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(b64: string): Uint8Array {
  const pad = "=".repeat((4 - b64.length % 4) % 4);
  const base64 = (b64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

function getInitials(name?: string | null): string {
  if (!name) return "U";
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

export default function AccountClient() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  if (isPending) {
    return (
      <div className="px-4 py-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 skeleton rounded-2xl" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-32 skeleton rounded-lg" />
            <div className="h-4 w-44 skeleton rounded-lg" />
          </div>
        </div>
        {[1, 2, 3].map(i => <div key={i} className="h-16 skeleton rounded-2xl" />)}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="w-48 h-48 mb-1">
          <LottiePlayer animationData={signInAnim} loop className="w-full h-full" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">Sign in to continue</h2>
        <p className="text-gray-500 text-sm mb-6 max-w-xs">Track orders, save addresses, and get a personalised experience</p>
        <Link
          href="/login"
          className="bg-linear-to-r from-green-600 to-emerald-600 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-green-600/30 hover:shadow-xl transition-all"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    
    // Aggressive storage cleanup for PWA security
    localStorage.clear();
    sessionStorage.clear();
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    if (window.indexedDB && window.indexedDB.databases) {
      try {
        const dbs = await window.indexedDB.databases();
        dbs.forEach(db => { if (db.name) window.indexedDB.deleteDatabase(db.name); });
      } catch (e) { /* Ignore unsupported */ }
    }

    toast.success("Signed out successfully");
    router.push("/");
    router.refresh();
  };

  const initials = getInitials(session.user.name);

  return (
    <div className="md:max-w-2xl md:mx-auto">
      {/* Profile header */}
      <div className="bg-linear-to-br from-green-600 to-emerald-700 px-4 pt-6 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl border-2 border-white/30 shadow-lg">
            {initials}
          </div>
          <div>
            <h2 className="font-extrabold text-white text-lg">{session.user.name ?? "Welcome!"}</h2>
            <div className="flex items-center gap-1.5 text-sm text-green-100 mt-0.5">
              <Phone size={12} />
              <span>{(session.user as { phone?: string }).phone ?? session.user.email ?? "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pull-up card effect */}
      <div className="-mt-4 bg-gray-50 rounded-t-3xl px-4 pt-5 pb-4 space-y-2.5">
        {[
          { href: "/orders",            icon: Package,    label: "My Orders",       desc: "View & track your orders",       color: "bg-blue-50",   iconColor: "text-blue-600"   },
          { href: "/account/addresses", icon: MapPin,     label: "Saved Addresses", desc: "Manage delivery addresses",      color: "bg-orange-50", iconColor: "text-orange-600" },
          { href: "/wishlist",          icon: Heart,      label: "Wishlist",         desc: "Products you saved for later",   color: "bg-red-50",    iconColor: "text-red-500"    },
          { href: "/account/subscriptions", icon: Repeat, label: "Recurring Orders", desc: "Manage auto-repeat orders",      color: "bg-green-50",  iconColor: "text-green-600"  },
        ].map(({ href, icon: Icon, label, desc, color, iconColor }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-4 py-3.5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all group"
          >
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shrink-0`}>
              <Icon size={18} className={iconColor} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
          </Link>
        ))}

        {/* PWA install button */}
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3.5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-900">Install App</p>
            <p className="text-xs text-gray-400 mt-0.5">Faster access from your home screen</p>
          </div>
          <PWAInstallButton />
        </div>

        {/* Enable Notifications */}
        <button
          onClick={async () => {
            if (!("Notification" in window)) { toast.error("Notifications not supported"); return; }
            if (Notification.permission === "granted") { toast.success("Notifications already enabled"); return; }
            const perm = await Notification.requestPermission();
            if (perm === "granted") {
              try {
                const reg = await navigator.serviceWorker.ready;
                const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_KEY) as BufferSource });
                const { endpoint, keys } = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
                await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint, p256dh: keys.p256dh, auth: keys.auth }) });
                toast.success("Order notifications enabled!");
              } catch { toast.success("Notifications enabled"); }
            } else {
              toast.error("Notifications blocked. Enable in browser settings.");
            }
          }}
          className="flex items-center gap-3 w-full bg-white rounded-2xl border border-gray-100 px-4 py-3.5 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
            <Bell size={18} className="text-blue-600" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-gray-900">Order Notifications</p>
            <p className="text-xs text-gray-400 mt-0.5">Get push alerts for your orders</p>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </button>

        {/* Enable Location */}
        <button
          onClick={() => {
            if (!navigator.geolocation) { toast.error("Location not supported"); return; }
            navigator.geolocation.getCurrentPosition(
              () => toast.success("Location enabled! We can now show accurate delivery info."),
              () => toast.error("Location blocked. Enable it in browser settings.")
            );
          }}
          className="flex items-center gap-3 w-full bg-white rounded-2xl border border-gray-100 px-4 py-3.5 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
            <Navigation size={18} className="text-green-600" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-gray-900">Enable Location</p>
            <p className="text-xs text-gray-400 mt-0.5">For accurate delivery tracking</p>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </button>

        {/* Support */}
        <a
          href={`tel:+91${STORE_PHONE}`}
          className="flex items-center gap-3 w-full bg-white rounded-2xl border border-gray-100 px-4 py-3.5 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
            <Headphones size={18} className="text-orange-600" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-gray-900">Customer Support</p>
            <p className="text-xs text-gray-400 mt-0.5">Call us at +91 {STORE_PHONE}</p>
          </div>
          <Phone size={16} className="text-green-500" />
        </a>

        <div className="pt-1">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full bg-white rounded-2xl border border-red-100 px-4 py-3.5 hover:bg-red-50 transition-colors group shadow-sm"
          >
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <LogOut size={18} className="text-red-500" />
            </div>
            <span className="text-sm font-bold text-red-500">Sign Out</span>
          </button>
        </div>

        {/* Legal footer */}
        <div className="pt-2 pb-1 flex items-center justify-center gap-4 flex-wrap">
          <Link href="/terms"   className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Terms &amp; Conditions</Link>
          <span className="text-gray-200">·</span>
          <Link href="/privacy" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Privacy Policy</Link>
          <span className="text-gray-200">·</span>
          <Link href="/refunds" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Refund Policy</Link>
        </div>
      </div>
    </div>
  );
}
