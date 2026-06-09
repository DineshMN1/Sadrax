// The global DesktopHeader renders SearchBar (useSearchParams) + session on
// every store page, which can't be statically prerendered. The store is a
// live commerce/PWA surface anyway, so render the whole segment dynamically.
export const dynamic = "force-dynamic";

import { BottomNav } from "@/components/store/bottom-nav";
import { StickyCartBar } from "@/components/store/sticky-cart-bar";
import { DesktopHeader } from "@/components/store/desktop-header";
import { SplashScreen } from "@/components/store/splash-screen";
import { SessionPrompts } from "@/components/store/session-prompts";
import { FeedbackPrompt } from "@/components/store/feedback-prompt";
import { SWRegister } from "@/components/store/sw-register";
import { StoreConfigLoader } from "@/components/store/store-config-loader";
import { PostHogIdentify } from "@/components/store/posthog-identify";
import { PWAInstallBanner } from "@/components/store/pwa-install-banner";
import { Toaster } from "sonner";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <SplashScreen />
      <SWRegister />
      <StoreConfigLoader />
      <PostHogIdentify />
      <DesktopHeader />

      <main className="max-w-xl mx-auto md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[88rem] pb-28 md:pb-8 min-h-screen">
        {children}
      </main>

      <StickyCartBar className="md:hidden" />
      <BottomNav />
      <SessionPrompts />
      <FeedbackPrompt />
      <PWAInstallBanner />

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
