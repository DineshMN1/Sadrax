import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions — Sadrax",
  description: "Terms and Conditions for Sadrax Grocery, Sadras.",
};

const STORE_NAME    = "Sadrax Grocery";
const STORE_ADDRESS = "Sadras, Kalpakam, Tamil Nadu — 603102";
const STORE_EMAIL   = process.env.NEXT_PUBLIC_STORE_EMAIL ?? "support@sadrax.in";
const STORE_PHONE   = process.env.NEXT_PUBLIC_STORE_PHONE ?? "9876543210";
const APP_URL       = process.env.NEXT_PUBLIC_APP_URL     ?? "https://sadrax.in";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h2 className="text-base font-extrabold text-gray-900">{title}</h2>
    <div className="text-sm text-gray-600 leading-relaxed space-y-2">{children}</div>
  </section>
);

export default function TermsPage() {
  return (
    <div>
      <div className="sticky top-0 z-20 glass border-b border-gray-100/80 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
          <ChevronLeft size={20} className="text-gray-700" />
        </Link>
        <h1 className="text-lg font-extrabold text-gray-900">Terms &amp; Conditions</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <p className="text-xs text-gray-400">Last updated: June 2025</p>

        <p className="text-sm text-gray-600 leading-relaxed">
          Welcome to {STORE_NAME}. By placing an order or using our website at{" "}
          <span className="font-semibold text-gray-800">{APP_URL}</span>, you agree to be bound by
          these Terms and Conditions. Please read them carefully.
        </p>

        <Section title="1. About Us">
          <p>
            {STORE_NAME} is a local grocery delivery service operating in Sadras and Kalpakam,
            Tamil Nadu. We are licensed under FSSAI and registered under the applicable state
            laws for food retail. Our registered address is: <strong>{STORE_ADDRESS}</strong>.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <p>
            Our services are available to individuals aged 18 years or older with a valid
            delivery address within our serviceable pincodes (603102, 603103, 603104, 603105).
            By using this platform, you represent that you meet these requirements.
          </p>
        </Section>

        <Section title="3. Orders &amp; Pricing">
          <p>
            All prices are displayed in Indian Rupees (₹) and are inclusive of applicable taxes.
            We reserve the right to modify prices without prior notice. Once an order is placed
            and accepted, the price at the time of order shall apply.
          </p>
          <p>
            Product availability is subject to stock. If an ordered item is unavailable after
            order placement, we will contact you or adjust the order accordingly.
          </p>
        </Section>

        <Section title="4. Payment">
          <p>
            Currently we accept <strong>Cash on Delivery (COD)</strong> only. Payment is due at
            the time of delivery. Please keep exact change ready when possible.
          </p>
          <p>
            We do not store any card or banking information on our servers.
          </p>
        </Section>

        <Section title="5. Delivery">
          <p>
            We deliver within Sadras and Kalpakam (pincodes 603102–603105) only.
            Estimated delivery time is 30–60 minutes from order acceptance, subject to
            availability and distance. Delivery is free above a minimum order value;
            otherwise a delivery fee applies as shown at checkout.
          </p>
          <p>
            We are not responsible for delays caused by circumstances beyond our control
            (weather, traffic, force majeure).
          </p>
        </Section>

        <Section title="6. Cancellation &amp; Refunds">
          <p>
            You may cancel an order before it is accepted by the store. Once accepted,
            cancellations are at our discretion. See our{" "}
            <Link href="/refunds" className="text-green-600 font-semibold hover:underline">
              Refund &amp; Cancellation Policy
            </Link>{" "}
            for full details.
          </p>
        </Section>

        <Section title="7. Product Quality">
          <p>
            We source products from reputable suppliers and maintain FSSAI-compliant
            storage and handling. If you receive a damaged, expired, or incorrect product,
            please contact us within 2 hours of delivery with a photo. We will replace or
            refund at our discretion.
          </p>
        </Section>

        <Section title="8. User Accounts">
          <p>
            You are responsible for maintaining the confidentiality of your account. You must
            not share your OTP or login credentials with anyone. We are not liable for
            unauthorised access resulting from your negligence.
          </p>
        </Section>

        <Section title="9. Prohibited Use">
          <p>You agree not to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Place fraudulent or false orders</li>
            <li>Use automated bots or scripts to access the platform</li>
            <li>Attempt to interfere with the service or security systems</li>
            <li>Misuse coupon codes or promotional offers</li>
          </ul>
        </Section>

        <Section title="10. Intellectual Property">
          <p>
            All content on this platform — including the Sadrax name, logo, design, and text —
            is owned by us and protected under applicable Indian intellectual property laws.
            You may not reproduce or use any content without our written permission.
          </p>
        </Section>

        <Section title="11. Limitation of Liability">
          <p>
            To the maximum extent permitted by law, {STORE_NAME} shall not be liable for
            any indirect, incidental, or consequential damages arising from use of our platform
            or services. Our total liability to you shall not exceed the value of your last order.
          </p>
        </Section>

        <Section title="12. Governing Law">
          <p>
            These Terms are governed by the laws of India. Any disputes shall be subject to
            the exclusive jurisdiction of courts in Chengalpattu District, Tamil Nadu.
          </p>
        </Section>

        <Section title="13. Grievance Officer">
          <p>
            As required under the Information Technology Act, 2000 and Consumer Protection
            (E-Commerce) Rules, 2020, we have appointed a Grievance Officer:
          </p>
          <div className="bg-gray-50 rounded-xl p-3 space-y-1 border border-gray-100">
            <p><strong>Name:</strong> Store Manager, {STORE_NAME}</p>
            <p><strong>Address:</strong> {STORE_ADDRESS}</p>
            <p><strong>Email:</strong> {STORE_EMAIL}</p>
            <p><strong>Phone:</strong> +91 {STORE_PHONE}</p>
            <p className="text-xs text-gray-400 mt-1">
              Complaints will be acknowledged within 48 hours and resolved within 15 days.
            </p>
          </div>
        </Section>

        <Section title="14. Changes to Terms">
          <p>
            We may update these Terms at any time. Continued use of the platform after
            changes constitutes acceptance of the updated Terms. The date of the last
            update is shown at the top of this page.
          </p>
        </Section>

        <div className="text-sm text-gray-500 pt-4 border-t border-gray-100 space-y-1">
          <p>Questions? Contact us:</p>
          <p className="font-semibold text-gray-700">
            {STORE_EMAIL} · +91 {STORE_PHONE}
          </p>
        </div>
      </div>
    </div>
  );
}
