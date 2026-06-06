// Return / refund eligibility — single source of truth for the published
// Refund & Cancellation policy. Shared by the customer UI and the API.

// Window to report an issue after delivery (policy: "within 2 hours of delivery").
export const RETURN_WINDOW_HOURS = 2;

// The only reasons eligible for a return/refund. "Change of mind" is excluded
// because perishables are non-refundable once delivered.
export const RETURN_REASONS = [
  { value: "wrong_item", label: "Wrong product delivered", desc: "Different from what I ordered" },
  { value: "damaged",    label: "Damaged / broken",        desc: "Item arrived visibly damaged" },
  { value: "expired",    label: "Expired product",         desc: "Past its best-before date" },
  { value: "missing",    label: "Missing item",            desc: "An item was not delivered" },
] as const;

export type ReturnReason = (typeof RETURN_REASONS)[number]["value"];

export const RETURN_REASON_LABELS: Record<string, string> =
  Object.fromEntries(RETURN_REASONS.map((r) => [r.value, r.label]));

export function isValidReason(v: unknown): v is ReturnReason {
  return typeof v === "string" && RETURN_REASONS.some((r) => r.value === v);
}

// The reference moment for the window: when the order was delivered. Falls back
// to updatedAt for legacy orders delivered before deliveredAt was tracked.
export function deliveryMoment(order: { deliveredAt: Date | null; updatedAt: Date }): Date {
  return order.deliveredAt ?? order.updatedAt;
}

export function returnWindowClosesAt(order: { deliveredAt: Date | null; updatedAt: Date }): Date {
  return new Date(deliveryMoment(order).getTime() + RETURN_WINDOW_HOURS * 60 * 60 * 1000);
}

// Can the customer still raise a request for this order right now?
export function canRequestReturn(
  order: { status: string; deliveredAt: Date | null; updatedAt: Date },
  now: Date = new Date()
): boolean {
  if (order.status !== "delivered") return false;
  return now <= returnWindowClosesAt(order);
}

export const RETURN_STATUS_META: Record<string, { label: string; tone: string }> = {
  pending:  { label: "Under review", tone: "bg-amber-50 text-amber-700 border-amber-200" },
  approved: { label: "Approved",     tone: "bg-green-50 text-green-700 border-green-200" },
  rejected: { label: "Declined",     tone: "bg-red-50 text-red-600 border-red-200" },
};
