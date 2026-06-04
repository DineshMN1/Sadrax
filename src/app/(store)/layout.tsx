import { BottomNav } from "@/components/store/bottom-nav";
import { StickyCartBar } from "@/components/store/sticky-cart-bar";
import { DesktopSidebar } from "@/components/store/desktop-sidebar";
import { CallStoreButton } from "@/components/store/call-store-button";
import { SplashScreen } from "@/components/store/splash-screen";
import { SessionPrompts } from "@/components/store/session-prompts";
import { SWRegister } from "@/components/store/sw-register";
import { Toaster } from "sonner";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <SplashScreen />
      <SWRegister />
      <DesktopSidebar />

      <div className="md:ml-56 lg:ml-64">
        <main className="max-w-xl mx-auto md:mx-0 md:max-w-none pb-28 md:pb-8 min-h-screen">
          {children}
        </main>
      </div>

      <StickyCartBar className="md:hidden" />
      <BottomNav />
      <CallStoreButton />
      <SessionPrompts />

      <Toaster
        position="top-center"
        richColors
        expand={false}
        toastOptions={{
          duration: 3000,
          classNames: {
            toast: "rounded-2xl font-medium text-sm shadow-xl border-0 !px-4 !py-3",
            success: "!bg-green-600 !text-white",
            error: "!bg-gray-900 !text-white",
            info: "!bg-blue-600 !text-white",
            description: "!text-white/80 !text-xs",
          },
        }}
      />
    </div>
  );
}
