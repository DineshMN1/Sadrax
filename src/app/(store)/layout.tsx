import { BottomNav } from "@/components/store/bottom-nav";
import { StickyCartBar } from "@/components/store/sticky-cart-bar";
import { DesktopSidebar } from "@/components/store/desktop-sidebar";
import { CallStoreButton } from "@/components/store/call-store-button";
import { Toaster } from "sonner";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DesktopSidebar />

      <div className="md:ml-56 lg:ml-64">
        <main className="max-w-xl mx-auto md:mx-0 md:max-w-none pb-28 md:pb-8 min-h-screen">
          {children}
        </main>
      </div>

      <StickyCartBar className="md:hidden" />
      <BottomNav />
      <CallStoreButton />

      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          classNames: {
            toast: "rounded-2xl font-medium text-sm shadow-lg border-0",
            success: "!bg-green-600 !text-white",
            error: "!bg-gray-900 !text-white",
            info: "!bg-blue-600 !text-white",
          },
        }}
      />
    </div>
  );
}
