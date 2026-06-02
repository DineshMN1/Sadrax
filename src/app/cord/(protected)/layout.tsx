import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Toaster } from "sonner";

export default async function CordProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/cord/login");

  const role = (session.user as { role?: string }).role;
  if (!role || !["admin", "staff"].includes(role)) redirect("/cord/login");

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {children}
      <Toaster theme="dark" position="top-center" richColors />
    </div>
  );
}
