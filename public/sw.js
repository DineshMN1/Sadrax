// Sadrax Service Worker — handles push notifications

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

// A (pass-through) fetch handler is required for PWA installability in some browsers.
self.addEventListener("fetch", () => { /* let the network handle it */ });

/* ── Push notification received ────────────────────────────────── */
self.addEventListener("push", e => {
  let data = { title: "Sadrax", body: "You have a new update", url: "/orders" };
  try { data = { ...data, ...e.data?.json() }; } catch {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      vibrate: [150, 75, 150],
      tag: "sadrax-order",
      renotify: true,
      data: { url: data.url },
      actions: [
        { action: "view",  title: "View Order" },
        { action: "close", title: "Dismiss"    },
      ],
    })
  );
});

/* ── Notification click ─────────────────────────────────────────── */
self.addEventListener("notificationclick", e => {
  e.notification.close();
  if (e.action === "close") return;

  const url = e.notification.data?.url ?? "/orders";
  e.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
  );
});
