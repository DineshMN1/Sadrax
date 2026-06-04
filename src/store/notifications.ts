"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AppNotification {
  id: string;
  orderId: number;
  orderNumber: string;
  message: string;
  read: boolean;
  createdAt: number; // epoch ms
}

interface NotificationsState {
  items:     AppNotification[];
  unread:    () => number;
  add:       (n: Omit<AppNotification, "id" | "read" | "createdAt">) => void;
  markRead:  (id: string) => void;
  markAllRead: () => void;
  clear:     () => void;
}

export const useNotifications = create<NotificationsState>()(
  persist(
    (set, get) => ({
      items: [],
      unread: () => get().items.filter(n => !n.read).length,
      add: (n) => {
        const exists = get().items.find(
          i => i.orderId === n.orderId && i.message === n.message
        );
        if (exists) return;
        set(state => ({
          items: [
            { ...n, id: `${n.orderId}_${Date.now()}`, read: false, createdAt: Date.now() },
            ...state.items,
          ].slice(0, 30),
        }));
      },
      markRead:    (id) => set(s => ({ items: s.items.map(n => n.id === id ? { ...n, read: true } : n) })),
      markAllRead: () => set(s => ({ items: s.items.map(n => ({ ...n, read: true })) })),
      clear: () => set({ items: [] }),
    }),
    { name: "sadrax-notifications" }
  )
);
