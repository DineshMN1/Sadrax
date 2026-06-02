"use client";

interface Props {
  openTime?: string;
  closeTime?: string;
}

export function StoreClosedBanner({ openTime = "8:00 AM", closeTime = "9:00 PM" }: Props) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-3">
      <span className="text-xl">🔒</span>
      <div>
        <p className="text-sm font-semibold text-amber-800">Store is closed</p>
        <p className="text-xs text-amber-600">
          We&apos;re open {openTime} – {closeTime}. You can browse, but orders are paused.
        </p>
      </div>
    </div>
  );
}
