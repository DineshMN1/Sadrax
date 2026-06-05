import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Toaster } from "sonner";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/admin/login");

  const role = (session.user as { role?: string }).role;
  if (!role || !["admin", "staff"].includes(role)) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Only plain serialisable props cross the server→client boundary */}
      <AdminSidebar email={session.user.email ?? ""} />
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        <main className="flex-1 w-full p-4 md:p-6 max-w-6xl pt-14 md:pt-6">{children}</main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}
