import webPush from "web-push";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

webPush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

type Sub = typeof pushSubscriptions.$inferSelect;

// Deliver to a single subscription. Returns true on success. Cleans up
// subscriptions the push service reports as gone (404/410).
async function deliver(sub: Sub, payload: PushPayload): Promise<boolean> {
  try {
    await webPush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      { TTL: 86400 }
    );
    return true;
  } catch (err: unknown) {
    const code = (err as { statusCode?: number }).statusCode;
    if (code === 404 || code === 410) {
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
    }
    return false;
  }
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  if (subs.length === 0) return;
  await Promise.allSettled(subs.map(sub => deliver(sub, payload)));
}

// Broadcast to every registered device, in batches to avoid opening too many
// connections at once. Returns how many sends succeeded / failed.
export async function sendPushToAll(payload: PushPayload): Promise<{ sent: number; failed: number; total: number }> {
  const subs = await db.select().from(pushSubscriptions);
  const BATCH = 50;
  let sent = 0;

  for (let i = 0; i < subs.length; i += BATCH) {
    const slice = subs.slice(i, i + BATCH);
    const results = await Promise.all(slice.map(sub => deliver(sub, payload)));
    sent += results.filter(Boolean).length;
  }

  return { sent, failed: subs.length - sent, total: subs.length };
}
