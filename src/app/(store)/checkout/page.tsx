"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, MapPin, Plus, Truck, CreditCard, Banknote, Check, Navigation } from "lucide-react";
import { useCart } from "@/store/cart";
import { formatPrice, isDeliverable } from "@/lib/utils";
import { toast } from "sonner";
import loadDynamic from "next/dynamic";

const LocationPicker = loadDynamic(
  () => import("@/components/store/location-picker").then(m => ({ default: m.LocationPicker })),
  { ssr: false }
);

interface Address {
  id: number;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city?: string;
  pincode: string;
  isDefault: boolean;
}

type PaymentMethod = "cod" | "upi";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, deliveryFee, discount, couponCode, total, clearCart } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [placing, setPlacing] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [pinLat, setPinLat] = useState<number | null>(null);
  const [pinLng, setPinLng] = useState<number | null>(null);
  const [newAddress, setNewAddress] = useState({ name: "", phone: "", line1: "", line2: "", city: "Sadras", pincode: "", label: "home" });

  const sub = subtotal();
  const fee = deliveryFee();
  const tot = total();

  useEffect(() => {
    fetch("/api/addresses").then((r) => r.json()).then((data) => {
      setAddresses(data.addresses ?? []);
      const def = data.addresses?.find((a: Address) => a.isDefault);
      if (def) setSelectedAddress(def.id);
    });
  }, []);

  const handleSaveAddress = async () => {
    if (!newAddress.name || !newAddress.phone || !newAddress.line1 || !newAddress.pincode) {
      toast.error("Fill all required fields");
      return;
    }
    if (!isDeliverable(newAddress.pincode)) {
      toast.error("Sorry, we don't deliver to this pincode yet");
      return;
    }
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newAddress, lat: pinLat, lng: pinLng }),
    });
    const data = await res.json();
    if (res.ok) {
      setAddresses((prev) => [...prev, data.address]);
      setSelectedAddress(data.address.id);
      setShowAddAddress(false);
      toast.success("Address saved");
    } else {
      toast.error(data.error ?? "Could not save address");
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { toast.error("Select a delivery address"); return; }
    if (items.length === 0) { toast.error("Your cart is empty"); return; }

    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddress,
          paymentMethod,
          couponCode,
          items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Could not place order");
        return;
      }

      if (paymentMethod === "upi" && data.razorpayOrderId) {
        await handleRazorpayPayment(data.razorpayOrderId, data.orderId, data.orderNumber, tot);
      } else {
        clearCart();
        router.push(`/orders/${data.orderId}?placed=1`);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setPlacing(false);
    }
  };

  const handleRazorpayPayment = async (
    razorpayOrderId: string,
    orderId: number,
    orderNumber: string,
    amount: number
  ) => {
    const Razorpay = (window as unknown as { Razorpay: new (opts: object) => { open: () => void } }).Razorpay;
    const rzp = new Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount,
      currency: "INR",
      name: "Sadrax Grocery",
      description: `Order #${orderNumber}`,
      order_id: razorpayOrderId,
      handler: async (response: { razorpay_payment_id: string; razorpay_signature: string }) => {
        const verifyRes = await fetch("/api/orders/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            razorpayOrderId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          }),
        });
        if (verifyRes.ok) {
          clearCart();
          router.push(`/orders/${orderId}?placed=1`);
        } else {
          toast.error("Payment verification failed. Contact support.");
        }
      },
      prefill: { contact: addresses.find((a) => a.id === selectedAddress)?.phone },
      theme: { color: "#16a34a" },
    });
    rzp.open();
  };

  // Guard is in useEffect to avoid calling router during SSR
  useEffect(() => {
    if (items.length === 0) router.replace("/cart");
  }, [items.length, router]);

  if (items.length === 0) return null;

  // Full-screen map overlay for address pin-drop
  if (showMap) {
    return (
      <div className="flex flex-col h-screen">
        <div className="px-4 pt-4 pb-2 bg-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowMap(false)} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">
              <ChevronLeft size={20} />
            </button>
            <h2 className="font-bold text-gray-900">Pin delivery location</h2>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <LocationPicker
            onConfirm={(pos, display) => {
              setPinLat(pos.lat);
              setPinLng(pos.lng);
              setShowMap(false);
              const pincodeMatch = display?.match(/\b6\d{5}\b/);
              if (pincodeMatch) setNewAddress(p => ({ ...p, pincode: pincodeMatch[0] }));
              const parts = display?.split(",") ?? [];
              if (parts.length >= 2) setNewAddress(p => ({ ...p, line1: parts.slice(0, 2).join(",").trim().slice(0, 80) }));
            }}
            onClose={() => setShowMap(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Checkout</h1>
      </div>

      <div className="px-4 py-4 space-y-4 flex-1">
        {/* Delivery Address */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={16} className="text-green-600" />
            <h2 className="text-sm font-bold text-gray-900">Delivery Address</h2>
          </div>
          <div className="space-y-2">
            {addresses.map((addr) => (
              <button
                key={addr.id}
                onClick={() => setSelectedAddress(addr.id)}
                className={`w-full text-left p-3 rounded-2xl border-2 transition-colors ${selectedAddress === addr.id ? "border-green-500 bg-green-50" : "border-gray-100 bg-white"}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-gray-500 uppercase">{addr.label}</span>
                  {selectedAddress === addr.id && <Check size={14} className="text-green-600 ml-auto" />}
                </div>
                <p className="text-sm font-semibold text-gray-900">{addr.name}</p>
                <p className="text-sm text-gray-600">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                <p className="text-sm text-gray-500">{addr.city} — {addr.pincode}</p>
              </button>
            ))}

            {!showAddAddress ? (
              <button
                onClick={() => setShowAddAddress(true)}
                className="w-full flex items-center gap-2 p-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 text-sm font-semibold hover:border-green-400 hover:text-green-600 transition-colors"
              >
                <Plus size={16} /> Add new address
              </button>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <h3 className="text-sm font-bold text-gray-900">New Address</h3>
                {/* Pin on map */}
                <button onClick={() => setShowMap(true)}
                  className={`w-full flex items-center gap-2.5 p-3 rounded-xl border-2 text-sm font-medium transition-all ${pinLat ? "border-green-400 bg-green-50 text-green-700" : "border-dashed border-gray-200 text-gray-500 hover:border-green-400"}`}>
                  <Navigation size={15} className={pinLat ? "text-green-600" : "text-gray-400"} />
                  {pinLat ? `Pinned ✓ (${pinLat.toFixed(3)}, ${pinLng?.toFixed(3)})` : "Pin location on map (optional)"}
                </button>
                {(["name", "phone", "line1", "line2", "city", "pincode"] as const).map((field) => (
                  <input
                    key={field}
                    placeholder={field === "line1" ? "Street / Area *" : field === "line2" ? "Landmark (optional)" : `${field.charAt(0).toUpperCase() + field.slice(1)}${["name","phone","pincode"].includes(field) ? " *" : ""}`}
                    value={newAddress[field]}
                    onChange={(e) => setNewAddress((p) => ({ ...p, [field]: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/30"
                    inputMode={field === "phone" || field === "pincode" ? "numeric" : "text"}
                  />
                ))}
                <div className="flex gap-2">
                  <button onClick={() => setShowAddAddress(false)} className="flex-1 h-10 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
                  <button onClick={handleSaveAddress} className="flex-1 h-10 rounded-xl bg-green-600 text-white text-sm font-semibold">Save</button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Payment */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={16} className="text-green-600" />
            <h2 className="text-sm font-bold text-gray-900">Payment Method</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {([ { id: "cod", label: "Cash on Delivery", icon: Banknote }, { id: "upi", label: "UPI / Card", icon: CreditCard }] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setPaymentMethod(id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-colors ${paymentMethod === id ? "border-green-500 bg-green-50" : "border-gray-100 bg-white"}`}
              >
                <Icon size={22} className={paymentMethod === id ? "text-green-600" : "text-gray-500"} />
                <span className={`text-xs font-semibold ${paymentMethod === id ? "text-green-700" : "text-gray-600"}`}>{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Bill Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Bill Summary</h3>
          <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatPrice(sub)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-600">Delivery</span><span className={fee === 0 ? "text-green-600 font-semibold" : ""}>{fee === 0 ? "FREE" : formatPrice(fee)}</span></div>
          {discount > 0 && <div className="flex justify-between text-sm"><span className="text-green-600">Coupon</span><span className="text-green-600 font-semibold">-{formatPrice(discount)}</span></div>}
          <div className="border-t border-gray-100 pt-2 flex justify-between font-bold"><span>Total</span><span>{formatPrice(tot)}</span></div>
        </div>
      </div>

      <div className="sticky bottom-16 px-4 pb-3 bg-linear-to-t from-gray-50 pt-2">
        <button
          onClick={handlePlaceOrder}
          disabled={placing || !selectedAddress}
          className="w-full flex items-center justify-between bg-green-600 text-white px-5 py-3.5 rounded-2xl font-semibold shadow-lg shadow-green-600/30 disabled:opacity-60 disabled:pointer-events-none"
        >
          <span>{placing ? "Placing order..." : `Place Order${paymentMethod === "cod" ? " (COD)" : ""}`}</span>
          <span>{formatPrice(tot)}</span>
        </button>
      </div>
    </div>
  );
}
