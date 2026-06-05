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
  items: { name: string; qty: number }[];
  address?: string;
  paymentMethod: string;
}): string {
  const itemLines = order.items.map(i => `  • ${i.name} × ${i.qty}`).join("\n");
  const total = `₹${(order.total / 100).toFixed(0)}`;

  return `🛒 <b>New Order #${order.orderNumber}</b>

👤 ${order.customerName ?? "Customer"} · ${order.phone ?? "—"}
📍 ${order.address ?? "—"}
💳 ${order.paymentMethod.toUpperCase()} · <b>${total}</b>

<b>Items:</b>
${itemLines}`;
}
