"use client";

interface Props {
  openTime?: string;
  closeTime?: string;
  message?: string;
}

export function StoreClosedBanner({ openTime = "8:00 AM", closeTime = "9:00 PM", message }: Props) {
  return (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-4">
      <span className="text-2xl shrink-0">🔒</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-amber-900">Orders are paused</p>
        <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
          {message
            ? message
            : `We're open ${openTime} – ${closeTime}. You can browse products, but orders are paused right now.`}
        </p>
      </div>
    </div>
  );
}
