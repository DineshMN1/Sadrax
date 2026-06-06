"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, MapPin, Plus, Banknote, Check, Navigation, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { useStoreConfig } from "@/store/config";
import { requestCoords, getCachedCoords } from "@/lib/geo";
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
  const pincodes = useStoreConfig(s => s.pincodes);
  const isDeliverable = (pc: string) => pincodes.includes(pc.trim());
  const [addresses, setAddresses]             = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod]     = useState<PaymentMethod>("cod");
  const [placing, setPlacing]                 = useState(false);
  const [termsAccepted, setTermsAccepted]     = useState(false);
  const [loadingAddr, setLoadingAddr]         = useState(true);
  const [showAddAddress, setShowAddAddress]   = useState(false);
  const [showMap, setShowMap]                 = useState(false);
  const [pinLat, setPinLat]                   = useState<number | null>(null);
  const [pinLng, setPinLng]                   = useState<number | null>(null);
  const [newAddress, setNewAddress]           = useState({
    name: "", phone: "", line1: "", line2: "", city: "Sadras", pincode: "", label: "home",
  });

  // Live stock re-check (cart is persisted and can go stale; also guards
  // against deep-linking straight to /checkout past the cart's block)
  const [stockMap, setStockMap] = useState<Record<number, number>>({});
  const [stockLoaded, setStockLoaded] = useState(false);
  const idsKey = useMemo(
    () => [...new Set(items.map(i => i.id))].sort((a, b) => a - b).join(","),
    [items]
  );
  useEffect(() => {
    if (!idsKey) { setStockLoaded(true); return; }
    let cancelled = false;
    fetch(`/api/products?ids=${idsKey}`)
      .then(r => r.json())
      .then((d: { products?: { id: number; stock: number }[] }) => {
        if (cancelled) return;
        const m: Record<number, number> = {};
        for (const p of d.products ?? []) m[p.id] = p.stock;
        setStockMap(m);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setStockLoaded(true); });
    return () => { cancelled = true; };
  }, [idsKey]);

  const stockIssues = stockLoaded ? items.filter(i => i.quantity > (stockMap[i.id] ?? 0)) : [];
  const hasStockIssue = stockIssues.length > 0;

  const sub = subtotal();
  const fee = deliveryFee();
  const tot = total();

  useEffect(() => {
    fetch("/api/addresses")
      .then(r => r.json())
      .then(data => {
        setAddresses(data.addresses ?? []);
        const def = data.addresses?.find((a: Address) => a.isDefault);
        if (def) setSelectedAddress(def.id);
      })
      .catch(() => toast.error("Could not load addresses"))
      .finally(() => setLoadingAddr(false));
  }, []);

  const handleSaveAddress = async () => {
    if (!newAddress.name || !newAddress.phone || !newAddress.line1 || !newAddress.pincode) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!isDeliverable(newAddress.pincode)) {
      toast.error("We don't deliver to this pincode yet");
      return;
    }
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newAddress, lat: pinLat, lng: pinLng }),
    });
    const data = await res.json();
    if (res.ok) {
      setAddresses(prev => [...prev, data.address]);
      setSelectedAddress(data.address.id);
      setShowAddAddress(false);
      toast.success("Address saved successfully");
    } else {
      toast.error(data.error ?? "Could not save address");
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { toast.error("Please select a delivery address"); return; }
    if (items.length === 0) { toast.error("Your cart is empty"); return; }
    if (hasStockIssue) return; // inline banner already explains what to fix
    if (!termsAccepted) { toast.error("Please accept the Terms & Conditions"); return; }

    // Serviceability — warn (don't hard-block) if the address is out of zone
    const addr = addresses.find(a => a.id === selectedAddress);
    if (addr && !isDeliverable(addr.pincode)) {
      if (!confirm(`Heads up: ${addr.pincode} is outside our usual delivery area, so we may not be able to deliver. Place the order anyway?`)) return;
    }

    setPlacing(true);
    try {
      // Optional GPS capture so the rider can find the exact spot — never blocks
      const coords = getCachedCoords() ?? await requestCoords();

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddress,
          paymentMethod,
          couponCode,
          items: items.map(i => ({ productId: i.id, quantity: i.quantity })),
          deliveryLat: coords?.lat ?? null,
          deliveryLng: coords?.lng ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not place order");
        return;
      }
      clearCart();
      toast.success("Order placed!", { description: `#${data.orderNumber}` });
      router.push("/orders");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  useEffect(() => {
    if (items.length === 0) router.replace("/cart");
  }, [items.length, router]);

  if (items.length === 0) return null;

  // Full-screen map overlay
  if (showMap) {
    return (
      <div className="flex flex-col h-screen">
        <div className="px-4 pt-4 pb-2 glass border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowMap(false)} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
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
      {/* Header */}
      <div className="sticky top-0 z-20 glass border-b border-gray-100/80 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
          <ChevronLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="text-lg font-extrabold text-gray-900">Checkout</h1>
        <div className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-green-600">
          <ShieldCheck size={14} />
          Secure
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 flex-1">
        {/* Delivery Address */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
              <MapPin size={14} className="text-green-600" />
            </div>
            <h2 className="text-sm font-extrabold text-gray-900">Delivery Address</h2>
          </div>

          {loadingAddr ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {addresses.map(addr => (
                <button
                  key={addr.id}
                  onClick={() => setSelectedAddress(addr.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all ${
                    selectedAddress === addr.id
                      ? "border-green-500 bg-green-50 shadow-sm shadow-green-500/10"
                      : "border-gray-100 bg-white hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-full">{addr.label}</span>
                    {selectedAddress === addr.id && (
                      <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-green-600">
                        <Check size={12} /> Selected
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-gray-900">{addr.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                  <p className="text-xs text-gray-400">{addr.city} — {addr.pincode}</p>
                </button>
              ))}

              {!showAddAddress ? (
                <button
                  onClick={() => setShowAddAddress(true)}
                  className="w-full flex items-center gap-2 p-3.5 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 text-sm font-semibold hover:border-green-400 hover:text-green-600 transition-colors"
                >
                  <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Plus size={15} className="text-gray-500" />
                  </div>
                  Add new address
                </button>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3 animate-slide-up">
                  <h3 className="text-sm font-extrabold text-gray-900">New Address</h3>
                  <button
                    onClick={() => setShowMap(true)}
                    className={`w-full flex items-center gap-2.5 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      pinLat ? "border-green-400 bg-green-50 text-green-700" : "border-dashed border-gray-200 text-gray-500 hover:border-green-400"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${pinLat ? "bg-green-500" : "bg-gray-100"}`}>
                      <Navigation size={14} className={pinLat ? "text-white" : "text-gray-400"} />
                    </div>
                    {pinLat ? `Pinned ✓ (${pinLat.toFixed(3)}, ${pinLng?.toFixed(3)})` : "Pin location on map (optional)"}
                  </button>
                  {(["name", "phone", "line1", "line2", "city", "pincode"] as const).map(field => (
                    <input
                      key={field}
                      placeholder={
                        field === "line1" ? "Street / Area *"
                        : field === "line2" ? "Landmark (optional)"
                        : `${field.charAt(0).toUpperCase() + field.slice(1)}${["name","phone","pincode"].includes(field) ? " *" : ""}`
                      }
                      value={newAddress[field]}
                      onChange={e => setNewAddress(p => ({ ...p, [field]: e.target.value }))}
                      inputMode={field === "phone" || field === "pincode" ? "numeric" : "text"}
                      className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all"
                    />
                  ))}
                  <div className="flex gap-2">
                    <button onClick={() => setShowAddAddress(false)} className="flex-1 h-10 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                    <button onClick={handleSaveAddress} className="flex-1 h-10 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors">Save</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Payment */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
              <Banknote size={14} className="text-green-600" />
            </div>
            <h2 className="text-sm font-extrabold text-gray-900">Payment Method</h2>
          </div>
          <button
            onClick={() => setPaymentMethod("cod")}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
              paymentMethod === "cod" ? "border-green-500 bg-green-50" : "border-gray-100 bg-white"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === "cod" ? "bg-green-500" : "bg-gray-100"}`}>
              <Banknote size={18} className={paymentMethod === "cod" ? "text-white" : "text-gray-500"} />
            </div>
            <div className="flex-1 text-left">
              <p className={`text-sm font-bold ${paymentMethod === "cod" ? "text-green-800" : "text-gray-700"}`}>Cash on Delivery</p>
              <p className="text-xs text-gray-400 mt-0.5">Pay when your order arrives</p>
            </div>
            {paymentMethod === "cod" && <Check size={18} className="text-green-600 shrink-0" />}
          </button>
        </section>

        {/* Bill Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <h3 className="text-sm font-extrabold text-gray-900">Bill Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-semibold text-gray-900">{formatPrice(sub)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Delivery</span>
            {fee === 0
              ? <span className="text-green-600 font-bold">FREE</span>
              : <span className="font-semibold text-gray-900">{formatPrice(fee)}</span>}
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Coupon ({couponCode})</span>
              <span className="text-green-600 font-bold">−{formatPrice(discount)}</span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-3 flex justify-between font-extrabold text-base">
            <span className="text-gray-900">Total</span>
            <span className="text-green-600">{formatPrice(tot)}</span>
          </div>
        </div>
      </div>

      {/* Place Order CTA */}
      <div className="sticky bottom-16 md:bottom-0 px-4 pb-4 pt-3 bg-linear-to-t from-gray-50 via-gray-50/90 to-transparent space-y-3">

        {/* Blocking hints — shown only when something is missing */}
        {hasStockIssue && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
            <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <div className="text-xs font-semibold text-red-700">
              <p>Some items aren&apos;t available in the quantity you chose:</p>
              <ul className="mt-1 space-y-0.5 font-medium">
                {stockIssues.map(i => {
                  const s = stockMap[i.id] ?? 0;
                  return <li key={i.id}>• {i.name} — {s === 0 ? "out of stock" : `only ${s} left`}</li>;
                })}
              </ul>
              <a href="/cart" className="inline-block mt-1.5 underline font-bold">Update cart →</a>
            </div>
          </div>
        )}
        {!selectedAddress && (
          <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
            <MapPin size={15} className="text-amber-500 shrink-0" />
            <p className="text-xs font-semibold text-amber-800">
              Add a delivery address to continue
            </p>
          </div>
        )}
        {selectedAddress && !termsAccepted && (
          <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2.5">
            <ShieldCheck size={15} className="text-blue-500 shrink-0" />
            <p className="text-xs font-semibold text-blue-800">
              Accept the Terms &amp; Conditions below to place your order
            </p>
          </div>
        )}

        {/* Terms checkbox */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="mt-0.5 shrink-0">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={e => setTermsAccepted(e.target.checked)}
              className="hidden"
            />
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
              termsAccepted ? "bg-green-600 border-green-600" : "border-gray-300 bg-white"
            }`}>
              {termsAccepted && <Check size={12} className="text-white" strokeWidth={3} />}
            </div>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            I agree to the{" "}
            <a href="/terms" target="_blank" className="text-green-600 font-semibold hover:underline">Terms &amp; Conditions</a>
            {" "}and{" "}
            <a href="/privacy" target="_blank" className="text-green-600 font-semibold hover:underline">Privacy Policy</a>
          </p>
        </label>

        <button
          onClick={handlePlaceOrder}
          disabled={placing || !selectedAddress || !termsAccepted || hasStockIssue}
          className="w-full flex items-center justify-between bg-linear-to-r from-green-600 to-emerald-600 text-white px-5 py-4 rounded-2xl font-bold shadow-lg shadow-green-600/30 disabled:opacity-50 disabled:pointer-events-none transition-all hover:shadow-xl hover:shadow-green-600/40 active:scale-[0.98]"
        >
          <span className="text-base flex items-center gap-2">
            {placing && <Loader2 size={18} className="animate-spin" />}
            {placing ? "Placing order…" : "Place Order (COD)"}
          </span>
          <span className="text-base font-extrabold">{formatPrice(tot)}</span>
        </button>
      </div>
    </div>
  );
}
