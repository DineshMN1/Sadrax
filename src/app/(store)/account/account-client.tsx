"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { User, Package, MapPin, LogOut, ChevronRight, Phone } from "lucide-react";
import { toast } from "sonner";

export default function AccountClient() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <span className="text-6xl mb-4">👤</span>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to continue</h2>
        <p className="text-gray-500 mb-6">Track orders, save addresses, and more</p>
        <Link href="/login" className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  };

  return (
    <div>
      <div className="bg-white px-4 py-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
            <User size={24} className="text-green-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{session.user.name ?? "Welcome!"}</h2>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Phone size={12} />
              <span>{(session.user as { phone?: string }).phone ?? session.user.email ?? "—"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {[
          { href: "/orders",            icon: Package, label: "My Orders",        desc: "View & track your orders" },
          { href: "/account/addresses", icon: MapPin,  label: "Saved Addresses",  desc: "Manage delivery addresses" },
        ].map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm"
          >
            <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center">
              <Icon size={18} className="text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </Link>
        ))}

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full bg-white rounded-2xl border border-red-100 px-4 py-3 text-red-500"
        >
          <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
            <LogOut size={18} className="text-red-500" />
          </div>
          <span className="text-sm font-semibold">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
