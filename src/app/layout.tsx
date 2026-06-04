import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const geistSans  = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono  = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "Sadrax Grocery", template: "%s — Sadrax" },
  description: "Sadras & Kalpakam-ல் fresh groceries — வீட்டுக்கே delivery!",
  manifest: "/manifest.json",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
