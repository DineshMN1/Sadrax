import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Sadrax",
  description: "Privacy Policy for Sadrax Grocery, Sadras.",
};

const STORE_NAME  = process.env.NEXT_PUBLIC_STORE_NAME  ?? "Sadrax Grocery";
const STORE_EMAIL = process.env.NEXT_PUBLIC_STORE_EMAIL ?? "support@sadrax.in";
const STORE_PHONE = process.env.NEXT_PUBLIC_STORE_PHONE ?? "9876543210";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h2 className="text-base font-extrabold text-gray-900">{title}</h2>
    <div className="text-sm text-gray-600 leading-relaxed space-y-2">{children}</div>
  </section>
);

export default function PrivacyPage() {
  return (
    <div>
      <div className="sticky top-0 z-20 glass border-b border-gray-100/80 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
          <ChevronLeft size={20} className="text-gray-700" />
        </Link>
        <h1 className="text-lg font-extrabold text-gray-900">Privacy Policy</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <p className="text-xs text-gray-400">Last updated: June 2026</p>

        <p className="text-sm text-gray-600 leading-relaxed">
          {STORE_NAME} (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your personal
          information. This Privacy Policy explains what data we collect, how we use it,
          and your rights — in compliance with India&apos;s Information Technology Act, 2000 and
          the Digital Personal Data Protection Act, 2023 (DPDP Act).
        </p>

        <Section title="1. Information We Collect">
          <p><strong>Account information:</strong> Name, email address, phone number when you register.</p>
          <p><strong>Delivery information:</strong> Delivery address, location coordinates (only when you permit), pincode.</p>
          <p><strong>Order information:</strong> Products ordered, order history, payment method (COD only — we do not collect card details).</p>
          <p><strong>Device information:</strong> IP address, browser type, device type, and usage logs — collected automatically for security and analytics.</p>
          <p><strong>Location:</strong> Only when you explicitly allow it in your browser. We use it to show your delivery area. We do not track you continuously.</p>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>To process and deliver your orders</li>
            <li>To send order status updates via SMS or email</li>
            <li>To verify your identity via OTP</li>
            <li>To improve our service and fix issues</li>
            <li>To prevent fraud and misuse</li>
            <li>To comply with legal obligations (FSSAI, GST, etc.)</li>
          </ul>
          <p>We do <strong>not</strong> sell, rent, or share your personal data with third parties for marketing purposes.</p>
        </Section>

        <Section title="3. Data Sharing">
          <p>We share your data only with:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Delivery staff</strong> — name, address, and phone for order delivery</li>
            <li><strong>Google (Gmail SMTP)</strong> — your email address is used to send OTPs and order notifications</li>
            <li><strong>Razorpay</strong> — for online payment processing (they handle card/UPI data; we never see it)</li>
            <li><strong>PostHog</strong> — anonymised usage analytics to improve the app (no personally identifiable data)</li>
            <li><strong>Neon (database)</strong> — your data is stored securely on Neon's encrypted servers</li>
            <li><strong>Cloudflare R2</strong> — product and category images are stored on Cloudflare</li>
            <li><strong>Legal authorities</strong> — if required by law or court order</li>
          </ul>
        </Section>

        <Section title="4. Data Retention">
          <p>
            We retain your account and order data for <strong>3 years</strong> from your last
            activity, or as required by law (GST records: 6 years). You may request deletion
            of your account at any time — see Section 7.
          </p>
        </Section>

        <Section title="5. Cookies &amp; Local Storage">
          <p>
            We use browser localStorage to save your cart, wishlist, and recently viewed
            products — entirely on your device. We do not use advertising cookies.
            We may use minimal analytics cookies (first-party only) to understand usage.
          </p>
        </Section>

        <Section title="6. Security">
          <p>
            We use HTTPS encryption for all data in transit. Passwords are not used —
            we authenticate via OTP only. Your data is stored on secured cloud infrastructure.
            While we take reasonable precautions, no system is 100% secure.
          </p>
        </Section>

        <Section title="7. Your Rights (DPDP Act 2023)">
          <p>You have the right to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Access</strong> — request a copy of your personal data</li>
            <li><strong>Correction</strong> — update inaccurate data via your account</li>
            <li><strong>Erasure</strong> — request deletion of your account and data</li>
            <li><strong>Grievance redressal</strong> — raise concerns with our Grievance Officer</li>
          </ul>
          <p>
            To exercise these rights, email us at{" "}
            <span className="font-semibold text-gray-800">{STORE_EMAIL}</span> from your
            registered email. We will respond within 15 days.
          </p>
        </Section>

        <Section title="8. Children's Privacy">
          <p>
            Our service is not directed to children under 18. We do not knowingly collect
            personal information from minors. If you believe a minor has registered, please
            contact us immediately.
          </p>
        </Section>

        <Section title="9. Third-Party Links">
          <p>
            Our platform may contain links to third-party websites (e.g. WhatsApp for support).
            We are not responsible for the privacy practices of those websites.
          </p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>
            We may update this policy periodically. We will notify you of significant changes
            via email or in-app notice. Continued use after changes constitutes acceptance.
          </p>
        </Section>

        <Section title="11. Grievance Officer">
          <div className="bg-gray-50 rounded-xl p-3 space-y-1 border border-gray-100">
            <p><strong>Name:</strong> Store Manager, {STORE_NAME}</p>
            <p><strong>Email:</strong> {STORE_EMAIL}</p>
            <p><strong>Phone:</strong> +91 {STORE_PHONE}</p>
            <p><strong>Hours:</strong> Monday–Saturday, 9 AM – 6 PM</p>
            <p className="text-xs text-gray-400 mt-1">Response within 48 hours · Resolution within 15 days</p>
          </div>
        </Section>

        <div className="pt-4 border-t border-gray-100 space-y-3">
          <div className="flex gap-4 text-sm">
            <Link href="/terms"   className="text-green-600 font-semibold hover:underline">Terms &amp; Conditions</Link>
            <Link href="/refunds" className="text-green-600 font-semibold hover:underline">Refund Policy</Link>
          </div>
          <p className="text-xs text-gray-300">© 2026 Sadrax. All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
}
