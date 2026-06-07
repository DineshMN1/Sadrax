// Pure invoice HTML builder — used by the customer invoice button (client) and
// the /orders/[id]/invoice route (server). No DOM/server deps so both can use it.

export interface InvoiceItem { name: string; unit?: string | null; quantity: number; price: number; total: number }
export interface InvoiceData {
  id: number;                 // order id → drives the sequential invoice number
  orderNumber: string;
  createdAt: string;          // ISO
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  couponCode?: string | null;
  items: InvoiceItem[];
  address?: { name: string; phone: string; line1: string; line2?: string | null; city?: string | null; pincode: string } | null;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const rupee = (p: number) => "₹" + (p / 100).toFixed(2);

// Standard, sequential invoice number derived from the order id.
export function invoiceNumber(id: number): string {
  return `INV-${String(id).padStart(6, "0")}`;
}

export function buildInvoiceHtml(d: InvoiceData): string {
  const invNo = invoiceNumber(d.id);
  const date = new Date(d.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const rows = d.items.map((i) => `
    <tr>
      <td>${esc(i.name)}${i.unit ? ` <span class="u">(${esc(i.unit)})</span>` : ""}</td>
      <td class="r">${i.quantity}</td>
      <td class="r">${rupee(i.price)}</td>
      <td class="r">${rupee(i.total)}</td>
    </tr>`).join("");
  const addr = d.address ? `
    <div class="box">
      <p class="lbl">Deliver to</p>
      <strong>${esc(d.address.name)}</strong><br>
      ${d.address.phone ? esc(d.address.phone) + "<br>" : ""}
      ${esc(d.address.line1)}${d.address.line2 ? ", " + esc(d.address.line2) : ""}<br>
      ${d.address.city ? esc(d.address.city) + " — " : ""}${esc(d.address.pincode)}
    </div>` : "";

  return `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${invNo}</title>
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
      <div><h1>Sadrax Grocery</h1><p class="muted" style="margin:2px 0">by Malik Stores · Tax Invoice</p></div>
      <div style="text-align:right">
        <p style="margin:0;font-size:15px"><strong>${invNo}</strong></p>
        <p class="muted" style="margin:2px 0">Order #${esc(d.orderNumber)}</p>
        <p class="muted" style="margin:2px 0">${date}</p>
        <p class="muted" style="margin:2px 0">${esc(d.paymentMethod.toUpperCase())}</p>
      </div>
    </div>
    ${addr}
    <table>
      <thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Amount</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="totals">
      <div class="row"><span class="muted">Subtotal</span><span>${rupee(d.subtotal)}</span></div>
      <div class="row"><span class="muted">Delivery</span><span>${d.deliveryFee === 0 ? "FREE" : rupee(d.deliveryFee)}</span></div>
      ${d.discount > 0 ? `<div class="row"><span class="muted">Discount${d.couponCode ? " (" + esc(d.couponCode) + ")" : ""}</span><span>-${rupee(d.discount)}</span></div>` : ""}
      <div class="row grand"><span>Total</span><span>${rupee(d.total)}</span></div>
    </div>
    <p class="foot">Thank you for shopping with Sadrax — by Malik Stores!</p>
  </body></html>`;
}
