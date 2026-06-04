"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { Package, MapPin, LogOut, ChevronRight, Phone, Heart } from "lucide-react";
import { toast } from "sonner";
import { PWAInstallButton } from "@/components/store/pwa-install-banner";

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
        <div className="w-20 h-20 bg-linear-to-br from-gray-100 to-gray-50 rounded-3xl flex items-center justify-center mb-5 text-4xl shadow-sm">
          👤
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
    toast.success("Signed out successfully");
    router.push("/");
    router.refresh();
  };

  const initials = getInitials(session.user.name);

  return (
    <div>
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
