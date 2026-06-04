import { Toaster } from "sonner";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: { default: "Sadrax Admin", template: "%s — Admin" },
  manifest: "/admin/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

// Minimal root wrapper for /admin — login page lives here unprotected.
// Auth protection lives in /admin/(protected)/layout.tsx.
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="top-right" richColors />
    </>
  );
}
