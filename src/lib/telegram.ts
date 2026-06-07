const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

export async function sendTelegramMessage(text: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) return; // silently skip if not configured

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: "HTML",
    }),
  }).catch(() => {}); // never throw — notification failure shouldn't break order flow
}

export function formatNewOrderMessage(order: {
  orderNumber: string;
  customerName?: string | null;
  phone?: string | null;
  total: number;
  items: { name: string; qty: number; price: number }[]; // price = unit price in paise
  address?: string;
  paymentMethod: string;
  cordUrl?: string;
}): string {
  const rupee = (p: number) => `₹${(p / 100).toFixed(0)}`;
  const itemLines = order.items
    .map(i => `  • ${i.name} × ${i.qty} — ${rupee(i.price * i.qty)} <i>(${rupee(i.price)} ea)</i>`)
    .join("\n");

  return `🛒 <b>New Order #${order.orderNumber}</b>

👤 ${order.customerName ?? "Customer"} · ${order.phone ?? "—"}
📍 ${order.address ?? "—"}
💳 ${order.paymentMethod.toUpperCase()} · <b>${rupee(order.total)}</b>

<b>Items:</b>
${itemLines}${order.cordUrl ? `\n\n🔗 <a href="${order.cordUrl}">Open in Cord →</a>` : ""}`;
}
