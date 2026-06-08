import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/providers/posthog-provider";

const geistSans  = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono  = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sadrax.in";
const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME ?? "Sadrax Grocery";
const DEFAULT_DESC = "Sadras & Kalpakkam-ல் fresh groceries — fast local delivery from your neighbourhood store. Order online in 2 taps.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: STORE_NAME, template: `%s — ${STORE_NAME}` },
  description: DEFAULT_DESC,
  keywords: ["grocery delivery", "Sadras grocery", "Kalpakkam grocery", "online grocery", "சாதரஸ் கிரசரி", "local delivery", "kirana store", "Sadras", "Kalpakkam"],
  creator: STORE_NAME,
  publisher: STORE_NAME,
  other: { copyright: `© 2026 ${STORE_NAME}. All Rights Reserved.` },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: STORE_NAME,
    title: STORE_NAME,
    description: DEFAULT_DESC,
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: STORE_NAME }],
  },
  twitter: {
    card: "summary",
    title: STORE_NAME,
    description: DEFAULT_DESC,
    images: ["/icons/icon-512.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sadrax",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
    icon:  [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* NOT IN PLAN FOR NOW — Razorpay checkout script */}
        {/* <script src="https://checkout.razorpay.com/v1/checkout.js" async /> */}
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
