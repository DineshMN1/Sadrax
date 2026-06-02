import { BottomNav } from "@/components/store/bottom-nav";
import { StickyCartBar } from "@/components/store/sticky-cart-bar";
import { DesktopSidebar } from "@/components/store/desktop-sidebar";
import { Toaster } from "sonner";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar — hidden on mobile */}
      <DesktopSidebar />

      {/* Main content area */}
      <div className="md:ml-56 lg:ml-64">
        {/* Tablet/desktop: centered narrow column with right panel space */}
        <main className="max-w-xl mx-auto md:mx-0 md:max-w-none pb-28 md:pb-8 min-h-screen">
          {children}
        </main>
      </div>

      {/* Mobile only */}
      <StickyCartBar className="md:hidden" />
      <BottomNav />

      <Toaster position="top-center" richColors />
    </div>
  );
}
