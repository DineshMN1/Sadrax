import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(paise: number): string {
  return `₹${(paise / 100).toFixed(paise % 100 === 0 ? 0 : 2)}`;
}

// ── Embedded variants ────────────────────────────────────────────────────────
// A product is "variant-driven" only when it carries 2+ embedded variants. A
// single (or zero) embedded variant is treated as a flat product whose
// top-level price/stock are authoritative. This is the SINGLE source of truth
// for the threshold — UI, checkout, and inventory must all agree, otherwise the
// price shown can differ from the price charged.
export interface EmbeddedVariant {
  unit: string;
  price: number;
  mrp?: number | null;
  stock: number;
  image?: string | null;
}

export function productHasVariants(
  variants: unknown,
): variants is EmbeddedVariant[] {
  return Array.isArray(variants) && variants.length > 1;
}

export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function generateOrderNumber(): string {
  const date = new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `SD${yy}${mm}${dd}${rand}`;
}

export const FREE_DELIVERY_THRESHOLD = Number(
  process.env.NEXT_PUBLIC_FREE_DELIVERY_THRESHOLD ?? 49900
);
export const DELIVERY_FEE = Number(
  process.env.NEXT_PUBLIC_DELIVERY_FEE ?? 4900
);

export function calculateDeliveryFee(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}

export const ORDER_STATUSES = [
  "pending",
  "accepted",
  "packed",
  "out_for_delivery",
  "delivered",
  "rejected",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  packed: "Packed",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  packed: "bg-purple-100 text-purple-800",
  out_for_delivery: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-600",
};

// Delivery zones – list of valid pincodes for Sadras/Kalpakam area
export const DELIVERY_PINCODES = [
  "603102", // Sadras & Kalpakam
];

export function isDeliverable(pincode: string): boolean {
  return DELIVERY_PINCODES.includes(pincode.trim());
}

// Normalize an Indian phone to a consistent "+91XXXXXXXXXX" using the LAST 10
// digits — robust against leading 0, "91", "+91" or pasted country codes.
// (Using the last 10 fixes the old "first-10" bug that turned 9940652142 into
// 9199406521 when "91" had been prepended.)
export function normalizeIndianPhone(raw: string | null | undefined): string {
  const last10 = (raw ?? "").replace(/\D/g, "").slice(-10);
  return last10.length === 10 ? `+91${last10}` : (raw ?? "").trim();
}
