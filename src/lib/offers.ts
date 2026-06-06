import type { Offer } from "@/lib/db/schema";

export interface OfferableLine { categoryId: number | null; lineTotal: number }

// Best auto-applicable discount (paise) across active promo offers. Bank offers
// are display-only and never auto-discount. Returns the winning offer too.
export function bestOfferDiscount(
  offers: Offer[],
  lines: OfferableLine[],
  subtotal: number,
  now: Date = new Date(),
): { discount: number; offer: Offer | null } {
  let best = 0;
  let winner: Offer | null = null;

  for (const o of offers) {
    if (!o.active) continue;
    if (o.expiresAt && o.expiresAt < now) continue;
    if (subtotal < (o.minOrder ?? 0)) continue;

    let base = 0;
    if (o.type === "cart_percent") base = subtotal;
    else if (o.type === "category_percent") base = lines.filter((l) => l.categoryId === o.categoryId).reduce((s, l) => s + l.lineTotal, 0);
    else continue; // bank = display only

    if (base <= 0 || !o.percent) continue;
    let d = Math.round((base * o.percent) / 100);
    if (o.maxDiscount != null) d = Math.min(d, o.maxDiscount);
    if (d > best) { best = d; winner = o; }
  }
  return { discount: best, offer: winner };
}
