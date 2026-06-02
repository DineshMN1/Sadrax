"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminNavProps {
  href: string;
  icon: React.ElementType;
  label: string;
  exact?: boolean;
  logout?: boolean;
  small?: boolean;
}

export function AdminNav({ href, icon: Icon, label, exact, logout, small }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  if (logout) {
    return (
      <button
        onClick={async () => { await signOut(); router.replace("/admin/login"); }}
        className={cn(
          "flex items-center gap-2.5 rounded-xl font-medium text-red-500 hover:bg-red-50 transition-colors",
          small ? "px-2 py-1.5 text-xs" : "w-full px-3 py-2 text-sm"
        )}
      >
        <LogOut size={small ? 14 : 16} />
        {label}
      </button>
    );
  }

  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
        active ? "bg-green-50 text-green-700 font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      <Icon size={16} strokeWidth={active ? 2.5 : 2} />
      {label}
    </Link>
  );
}
