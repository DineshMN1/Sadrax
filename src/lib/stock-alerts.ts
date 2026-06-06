import { db } from "@/lib/db";
import { stockAlerts } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { sendPushToUser } from "@/lib/push";

// Notify everyone who asked, then clear the alerts. Call when a product's stock
// transitions from 0 to a positive number.
export async function notifyBackInStock(productId: number, productName: string): Promise<void> {
  const alerts = await db
    .select()
    .from(stockAlerts)
    .where(and(eq(stockAlerts.productId, productId), eq(stockAlerts.notified, false)));

  if (alerts.length === 0) return;

  await Promise.allSettled(
    alerts.map((a) =>
      sendPushToUser(a.userId, {
        title: "Back in stock! 🛒",
        body: `${productName} is available again — grab it before it's gone.`,
        url: `/product/${productId}`,
      })
    )
  );

  await db.delete(stockAlerts).where(eq(stockAlerts.productId, productId));
}
