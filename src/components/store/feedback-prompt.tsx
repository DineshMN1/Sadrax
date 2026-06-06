"use client";

import { useEffect, useState, useCallback } from "react";
import { Star, X, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const SESSION_KEY = "sadrax_feedback_shown";
const RATING_LABELS = ["", "Very poor", "Not great", "It was okay", "Good", "Loved it!"];

export function FeedbackPrompt() {
  const [order, setOrder] = useState<{ id: number; orderNumber: string } | null>(null);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(() => { setVisible(false); setClosing(false); }, 300);
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/feedback/pending");
        const data = await res.json();
        if (data.order) { setOrder(data.order); setVisible(true); }
      } catch { /* ignore */ }
      sessionStorage.setItem(SESSION_KEY, "1");
    }, 5000);
    return () => clearTimeout(t);
  }, []);

  const submit = async () => {
    if (!order || rating === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? "Couldn't submit");
        setSubmitting(false);
        return;
      }
      setDone(true);
      setTimeout(close, 1400);
    } catch {
      toast.error("Something went wrong");
      setSubmitting(false);
    }
  };

  if (!visible || !order) return null;
  const shown = hover || rating;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-90 transition-opacity duration-300 ${closing ? "opacity-0" : "opacity-100"}`}
        onClick={() => close()}
      />
      <div className={`fixed bottom-0 left-0 right-0 z-91 max-w-lg mx-auto bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${closing ? "translate-y-full" : "translate-y-0"}`}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-gray-200" /></div>

        {done ? (
          <div className="px-6 py-10 text-center">
            <CheckCircle2 size={44} className="text-green-500 mx-auto mb-3" />
            <h2 className="text-lg font-extrabold text-gray-900">Thank you! 🙏</h2>
            <p className="text-sm text-gray-500 mt-1">Your feedback helps us serve Sadras better.</p>
          </div>
        ) : (
          <div className="px-6 pt-3 pb-8">
            <button onClick={() => close()} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500">
              <X size={16} />
            </button>

            <h2 className="text-lg font-extrabold text-gray-900 text-center">How was your order?</h2>
            <p className="text-sm text-gray-400 text-center mt-0.5">Order #{order.orderNumber}</p>

            {/* Stars */}
            <div className="flex justify-center gap-1.5 mt-5" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  className="p-1 transition-transform active:scale-90"
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                >
                  <Star size={38} className={n <= shown ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} strokeWidth={1.5} />
                </button>
              ))}
            </div>
            <p className={`text-center text-sm font-semibold mt-2 h-5 ${shown ? "text-amber-500" : "text-transparent"}`}>
              {RATING_LABELS[shown] || "Tap a star"}
            </p>

            {/* Optional comment */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Say something… (optional)"
              className="w-full mt-3 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 resize-none"
            />

            <button
              onClick={submit}
              disabled={rating === 0 || submitting}
              className="w-full mt-3 h-12 flex items-center justify-center gap-2 bg-green-600 text-white text-sm font-bold rounded-2xl hover:bg-green-700 disabled:opacity-40 transition-colors"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
              Submit feedback
            </button>
            <button onClick={() => close()} className="w-full mt-2 h-9 text-sm font-semibold text-gray-400 hover:text-gray-600">
              Maybe later
            </button>
          </div>
        )}
      </div>
    </>
  );
}
