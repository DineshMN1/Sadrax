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
  status?: string | null;
  couponCode?: string | null;
  freeNote?: string | null;
  edited?: boolean;
  items: InvoiceItem[];
  address?: { name: string; phone: string; line1: string; line2?: string | null; city?: string | null; pincode: string } | null;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const rupee = (p: number) => "₹" + (p / 100).toFixed(2);

// Standard, sequential invoice number derived from the order id.
export function invoiceNumber(id: number): string {
  return `INV-${String(id).padStart(6, "0")}`;
}

function buildStamp(status: string): string {
  if (status === "delivered") {
    return `<div class="stamp stamp-delivered">DELIVERED</div>`;
  }
  if (status === "rejected") {
    return `<div class="stamp stamp-rejected">REJECTED</div>`;
  }
  if (status === "cancelled") {
    return `<div class="stamp stamp-cancelled">CANCELLED</div>`;
  }
  return "";
}

export function buildInvoiceHtml(d: InvoiceData): string {
  const invNo = invoiceNumber(d.id);
  const date = new Date(d.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  const itemRows = d.items.map((i) => `
    <tr>
      <td>${esc(i.name)}${i.unit ? ` <span class="u">(${esc(i.unit)})</span>` : ""}
        <br><span class="u">${rupee(i.price)} × ${i.quantity}</span></td>
      <td class="r">${rupee(i.total)}</td>
    </tr>`).join("");

  const addr = d.address ? `
    <hr>
    <div class="sec">
      <strong>${esc(d.address.name)}</strong><br>
      ${d.address.phone ? esc(d.address.phone) + "<br>" : ""}
      ${esc(d.address.line1)}${d.address.line2 ? ", " + esc(d.address.line2) : ""}<br>
      ${d.address.city ? esc(d.address.city) + " — " : ""}${esc(d.address.pincode)}
    </div>` : "";

  const stamp = d.status ? buildStamp(d.status) : "";

  return `<!doctype html><html><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Invoice ${invNo}</title>
  <style>
    *{font-family:-apple-system,system-ui,Segoe UI,Roboto,sans-serif;box-sizing:border-box}
    body{max-width:420px;width:100%;margin:0 auto;padding:16px;color:#111;font-size:12px;position:relative}
    h1{font-size:18px;text-align:center;margin:0;color:#15803d}
    .muted{color:#777}.center{text-align:center}.u{color:#999;font-size:11px}
    hr{border:none;border-top:1px dashed #bbb;margin:8px 0}
    table{width:100%;border-collapse:collapse}
    td{padding:3px 0;vertical-align:top}.r{text-align:right;white-space:nowrap}
    .sec{margin:6px 0;line-height:1.5}
    .row{display:flex;justify-content:space-between;margin:2px 0}
    .tot{font-weight:700;font-size:15px}
    .free{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:8px;text-align:center;margin:8px 0}
    .stamp{
      position:fixed;top:50%;left:50%;
      transform:translate(-50%,-50%) rotate(-30deg);
      font-size:42px;font-weight:900;letter-spacing:2px;
      border-width:4px;border-style:solid;border-radius:8px;
      padding:6px 16px;opacity:0.18;pointer-events:none;white-space:nowrap;
      z-index:10;
    }
    .stamp-delivered{color:#15803d;border-color:#15803d}
    .stamp-rejected{color:#b91c1c;border-color:#b91c1c}
    .stamp-cancelled{color:#6b7280;border-color:#6b7280}
    @media print{
      body{max-width:100%;padding:8px}
      .stamp{position:fixed}
    }
  </style></head><body>
    ${stamp}
    <h1>Sadrax Grocery</h1>
    <p class="center muted" style="margin:2px 0 8px">by Malik Stores · Tax Invoice</p>
    <hr>
    <div class="row"><span class="muted">Invoice</span><strong>${invNo}</strong></div>
    <div class="row"><span class="muted">Order</span><span>#${esc(d.orderNumber)}</span></div>
    <div class="row"><span class="muted">Date</span><span>${date}</span></div>
    <div class="row"><span class="muted">Payment</span><span>${esc(d.paymentMethod.toUpperCase())}</span></div>
    ${d.edited ? `<p class="center muted" style="margin:6px 0 0;font-size:11px">* This order was edited by the store. Final items shown.</p>` : ""}
    ${d.freeNote ? `<div class="free">
      <p style="margin:0;font-weight:800;color:#15803d;font-size:13px">&#127873; Your order is FREE!</p>
      <p style="margin:3px 0 0;color:#16a34a;font-size:11px">${esc(d.freeNote)}</p>
    </div>` : ""}
    ${addr}
    <hr>
    <table>${itemRows}</table>
    <hr>
    <div class="row"><span class="muted">Subtotal</span><span>${rupee(d.subtotal)}</span></div>
    <div class="row"><span class="muted">Delivery</span><span>${d.deliveryFee === 0 ? "FREE" : rupee(d.deliveryFee)}</span></div>
    ${d.discount > 0 ? `<div class="row"><span class="muted">Discount${d.couponCode ? " (" + esc(d.couponCode) + ")" : ""}</span><span>-${rupee(d.discount)}</span></div>` : ""}
    <hr>
    <div class="row tot"><span>Total</span><span>${rupee(d.total)}</span></div>
    <hr>
    <p class="center muted">Thank you for shopping with Sadrax — by Malik Stores!</p>
  </body></html>`;
}
