"use client";

import { FileText } from "lucide-react";
import { toast } from "sonner";

interface InvoiceItem { name: string; unit?: string | null; quantity: number; price: number; total: number }
interface InvoiceProps {
  orderNumber: string;
  createdAt: string;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  couponCode?: string | null;
  customerName?: string | null;
  items: InvoiceItem[];
  address?: { name: string; phone: string; line1: string; line2?: string | null; city?: string | null; pincode: string } | null;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const rupee = (p: number) => "₹" + (p / 100).toFixed(2);

export function InvoiceButton(props: InvoiceProps) {
  const print = () => {
    const w = window.open("", "_blank", "width=460,height=720");
    if (!w) { toast.error("Allow pop-ups to view the invoice"); return; }
    const date = new Date(props.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    const rows = props.items.map((i) => `
      <tr>
        <td>${esc(i.name)}${i.unit ? ` <span class="u">(${esc(i.unit)})</span>` : ""}</td>
        <td class="r">${i.quantity}</td>
        <td class="r">${rupee(i.price)}</td>
        <td class="r">${rupee(i.total)}</td>
      </tr>`).join("");
    const addr = props.address ? `
      <div class="box">
        <p class="lbl">Deliver to</p>
        <strong>${esc(props.address.name)}</strong><br>
        ${props.address.phone ? esc(props.address.phone) + "<br>" : ""}
        ${esc(props.address.line1)}${props.address.line2 ? ", " + esc(props.address.line2) : ""}<br>
        ${props.address.city ? esc(props.address.city) + " — " : ""}${esc(props.address.pincode)}
      </div>` : "";

    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${esc(props.orderNumber)}</title>
    <style>
      *{font-family:-apple-system,system-ui,Segoe UI,Roboto,sans-serif;box-sizing:border-box}
      body{max-width:520px;margin:0 auto;padding:24px;color:#111;font-size:13px}
      .top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}
      h1{font-size:20px;margin:0;color:#16a34a}.muted{color:#777}
      .lbl{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#999;margin:0 0 4px}
      .box{background:#f9fafb;border:1px solid #eee;border-radius:10px;padding:12px;margin:10px 0;line-height:1.5}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th{text-align:left;font-size:11px;color:#999;border-bottom:1px solid #eee;padding:6px 4px}
      td{padding:7px 4px;border-bottom:1px solid #f3f4f6}.r{text-align:right;white-space:nowrap}
      .u{color:#999;font-size:11px}
      .totals{margin-top:10px;margin-left:auto;width:60%}
      .row{display:flex;justify-content:space-between;padding:3px 0}
      .grand{font-weight:700;font-size:16px;border-top:2px solid #111;margin-top:6px;padding-top:8px}
      .foot{text-align:center;color:#999;margin-top:24px;font-size:11px}
      @media print{body{padding:0}}
    </style></head><body>
      <div class="top">
        <div><h1>Sadrax Grocery</h1><p class="muted" style="margin:2px 0">Tax Invoice</p></div>
        <div style="text-align:right">
          <p style="margin:0"><strong>#${esc(props.orderNumber)}</strong></p>
          <p class="muted" style="margin:2px 0">${date}</p>
          <p class="muted" style="margin:2px 0">${props.paymentMethod.toUpperCase()}</p>
        </div>
      </div>
      ${addr}
      <table>
        <thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Amount</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="totals">
        <div class="row"><span class="muted">Subtotal</span><span>${rupee(props.subtotal)}</span></div>
        <div class="row"><span class="muted">Delivery</span><span>${props.deliveryFee === 0 ? "FREE" : rupee(props.deliveryFee)}</span></div>
        ${props.discount > 0 ? `<div class="row"><span class="muted">Discount${props.couponCode ? " (" + esc(props.couponCode) + ")" : ""}</span><span>-${rupee(props.discount)}</span></div>` : ""}
        <div class="row grand"><span>Total</span><span>${rupee(props.total)}</span></div>
      </div>
      <p class="foot">Thank you for shopping with Sadrax Grocery!</p>
    </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  return (
    <button
      onClick={print}
      className="w-full flex items-center justify-center gap-2 h-11 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-2xl hover:bg-gray-50 transition-colors"
    >
      <FileText size={15} /> Download invoice
    </button>
  );
}
