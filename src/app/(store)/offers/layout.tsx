import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offers & Coupons",
  description: "Latest grocery offers, deals and coupons for Sadrax grocery store in Sadras & Kalpakam. Save on your next order.",
  alternates: { canonical: "/offers" },
  openGraph: {
    title: "Offers & Coupons — Sadrax",
    description: "Latest grocery deals and coupon codes for local delivery.",
    url: "/offers",
  },
};

export default function OffersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
