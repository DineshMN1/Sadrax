import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: { default: "Cord Orders", template: "%s — Cord" },
  manifest: "/cord/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#ea580c",
};

// Minimal wrapper — login page is unprotected here.
// Auth protection lives in cord/(protected)/layout.tsx.
export default function CordRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
