import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy — Sadrax",
  description: "Refund and cancellation policy for Sadrax Grocery.",
};

const STORE_EMAIL = process.env.NEXT_PUBLIC_STORE_EMAIL ?? "support@sadrax.in";
const STORE_PHONE = process.env.NEXT_PUBLIC_STORE_PHONE ?? "9876543210";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h2 className="text-base font-extrabold text-gray-900">{title}</h2>
    <div className="text-sm text-gray-600 leading-relaxed space-y-2">{children}</div>
  </section>
);

const Row = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <div className="flex items-start justify-between gap-2 py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-sm text-gray-600 flex-1">{label}</span>
    <span className={`text-sm font-bold shrink-0 ${color ?? "text-gray-900"}`}>{value}</span>
  </div>
);

export default function RefundsPage() {
  return (
    <div>
      <div className="sticky top-0 z-20 glass border-b border-gray-100/80 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
          <ChevronLeft size={20} className="text-gray-700" />
        </Link>
        <h1 className="text-lg font-extrabold text-gray-900">Refund &amp; Cancellation</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <p className="text-xs text-gray-400">Last updated: June 2025</p>

        <p className="text-sm text-gray-600 leading-relaxed">
          We want you to be completely satisfied. If something is wrong with your order,
          we will make it right. Here&apos;s what you need to know:
        </p>

        {/* Quick reference table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h2 className="text-sm font-extrabold text-gray-900 mb-3">Quick Reference</h2>
          <Row label="Cancel before order is accepted"      value="✅ Free, instant"         color="text-green-600" />
          <Row label="Cancel after accepted (before packed)" value="Contact us immediately"   color="text-orange-600" />
          <Row label="Cancel after packed / out for delivery" value="❌ Not possible"         color="text-red-500" />
          <Row label="Wrong / damaged product on delivery"   value="✅ Full replacement/refund" color="text-green-600" />
          <Row label="Expired product delivered"             value="✅ Full replacement/refund" color="text-green-600" />
          <Row label="Missing item from order"               value="✅ Refund for missing item" color="text-green-600" />
          <Row label="Change of mind after delivery"         value="❌ Not applicable (perishables)" color="text-red-500" />
          <Row label="Refund mode (COD orders)"              value="Cash / UPI on next delivery" />
        </div>

        <Section title="1. Cancellation Policy">
          <p>
            <strong>Before acceptance:</strong> You can cancel any order directly from the
            app on your Order Detail page as long as the status is &quot;Pending&quot;.
            No questions asked.
          </p>
          <p>
            <strong>After acceptance:</strong> If your order has been accepted and is being
            prepared, please call us immediately at +91 {STORE_PHONE}. We will try to
            accommodate your request but cannot guarantee cancellation once packing has started.
          </p>
          <p>
            <strong>After dispatch:</strong> Once the order is Out for Delivery, cancellation
            is not possible. You may refuse delivery — in this case, the items will be returned
            to the store. For COD orders, no charge will apply.
          </p>
        </Section>

        <Section title="2. Refund Policy">
          <p>Refunds are issued in the following cases:</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li><strong>Wrong product delivered</strong> — different from what was ordered</li>
            <li><strong>Damaged / broken product</strong> — visibly damaged on delivery</li>
            <li><strong>Expired product</strong> — product is past its &quot;Best Before&quot; date</li>
            <li><strong>Missing item</strong> — item in your order was not delivered</li>
            <li><strong>Store cancels your order</strong> — due to unavailability or area not serviceable</li>
          </ul>
        </Section>

        <Section title="3. How to Raise a Complaint">
          <p>
            To report a problem with your order, contact us within <strong>2 hours of delivery</strong>:
          </p>
          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 border border-gray-100">
            <p>📞 Call: <strong>+91 {STORE_PHONE}</strong></p>
            <p>📧 Email: <strong>{STORE_EMAIL}</strong></p>
            <p className="text-xs text-gray-400">Please include your order number and a photo of the issue.</p>
          </div>
          <p>
            Complaints raised after 2 hours of delivery may not be entertained, except for
            health or safety concerns (contact us immediately in those cases).
          </p>
        </Section>

        <Section title="4. Refund Process">
          <p>
            Since we currently only support <strong>Cash on Delivery</strong>, refunds are
            processed as:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Cash deducted from your next order payment, or</li>
            <li>Direct UPI transfer within 24 hours upon request</li>
          </ul>
          <p>
            Once a refund or replacement is agreed, it will be processed within
            <strong> 1–2 business days</strong>.
          </p>
        </Section>

        <Section title="5. Non-Refundable Items">
          <p>
            The following cannot be returned or refunded unless defective or expired:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Perishable items (vegetables, fruits, dairy, cooked food) once delivered</li>
            <li>Items with broken seals that were intact on delivery</li>
          </ul>
        </Section>

        <Section title="6. Consumer Rights">
          <p>
            Your statutory rights under the <strong>Consumer Protection Act, 2019</strong> are
            not affected by this policy. If you are not satisfied with our response, you may
            file a complaint with the National Consumer Helpline (1800-11-4000) or at{" "}
            <strong>consumerhelpline.gov.in</strong>.
          </p>
        </Section>

        <div className="flex gap-4 pt-4 border-t border-gray-100 text-sm">
          <Link href="/terms" className="text-green-600 font-semibold hover:underline">Terms &amp; Conditions</Link>
          <Link href="/privacy" className="text-green-600 font-semibold hover:underline">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
