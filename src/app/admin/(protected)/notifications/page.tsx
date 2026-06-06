"use client";

import { useState, useEffect } from "react";
import { Bell, Send, Users, Smartphone, Loader2 } from "lucide-react";
import { toast } from "sonner";

const TITLE_MAX = 80;
const BODY_MAX = 180;

const PRESETS = [
  { label: "Flash sale", title: "⚡ Flash Sale is live!", body: "Big savings for the next few hours — grab them before they're gone.", url: "/categories" },
  { label: "New arrivals", title: "🛒 Fresh stock just dropped", body: "New products added today. Take a look!", url: "/categories" },
  { label: "Free delivery", title: "🚚 Free delivery today", body: "Order now and skip the delivery fee on us.", url: "/" },
];

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [sending, setSending] = useState(false);
  const [reach, setReach] = useState<{ devices: number; users: number } | null>(null);

  const fetchReach = async () => {
    const res = await fetch("/api/admin/push");
    if (res.ok) setReach(await res.json());
  };

  useEffect(() => { fetchReach(); }, []);

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setTitle(p.title);
    setBody(p.body);
    setUrl(p.url);
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) { toast.error("Add a title and a message"); return; }
    const count = reach?.devices ?? 0;
    if (count === 0) { toast.error("No subscribed devices yet"); return; }
    if (!confirm(`Send this notification to ${count} device${count === 1 ? "" : "s"}?`)) return;

    setSending(true);
    const res = await fetch("/api/admin/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, url }),
    });
    const data = await res.json();
    setSending(false);

    if (res.ok) {
      toast.success(`Sent to ${data.sent} of ${data.total} device${data.total === 1 ? "" : "s"}`);
      if (data.failed > 0) toast.message(`${data.failed} could not be delivered (expired devices were cleaned up)`);
      setTitle(""); setBody(""); setUrl("/");
      fetchReach();
    } else {
      toast.error(data.error ?? "Failed to send");
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Push Notifications</h1>
        <p className="text-sm text-gray-400 mt-0.5">Send an announcement to everyone who enabled notifications.</p>
      </div>

      {/* Reach */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center"><Smartphone size={18} /></div>
          <div>
            <p className="text-xl font-bold text-gray-900 leading-none">{reach?.devices ?? "—"}</p>
            <p className="text-xs text-gray-400 mt-1">Subscribed devices</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Users size={18} /></div>
          <div>
            <p className="text-xl font-bold text-gray-900 leading-none">{reach?.users ?? "—"}</p>
            <p className="text-xs text-gray-400 mt-1">Reachable customers</p>
          </div>
        </div>
      </div>

      {/* Composer */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => applyPreset(p)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100">
              {p.label}
            </button>
          ))}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500">Title</label>
            <span className={`text-[10px] ${title.length > TITLE_MAX ? "text-red-500" : "text-gray-300"}`}>{title.length}/{TITLE_MAX}</span>
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={TITLE_MAX + 10} placeholder="⚡ Flash Sale is live!"
            className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm w-full focus:outline-none focus:border-green-500" />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500">Message</label>
            <span className={`text-[10px] ${body.length > BODY_MAX ? "text-red-500" : "text-gray-300"}`}>{body.length}/{BODY_MAX}</span>
          </div>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={BODY_MAX + 20} rows={3} placeholder="Big savings for the next few hours…"
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm w-full focus:outline-none focus:border-green-500 resize-none" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500">Open link on tap</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/categories"
            className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm w-full focus:outline-none focus:border-green-500" />
        </div>

        {/* Preview */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-500">Preview</p>
          <div className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-3">
            <div className="w-9 h-9 rounded-lg bg-green-600 text-white flex items-center justify-center shrink-0"><Bell size={16} /></div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{title || "Notification title"}</p>
              <p className="text-xs text-gray-500 line-clamp-2">{body || "Your message will appear here."}</p>
              <p className="text-[10px] text-gray-300 mt-0.5">Sadrax · now</p>
            </div>
          </div>
        </div>

        <button onClick={handleSend} disabled={sending} className="w-full h-11 flex items-center justify-center gap-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
          {sending ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : <><Send size={16} /> Send to {reach?.devices ?? 0} device{reach?.devices === 1 ? "" : "s"}</>}
        </button>
      </div>
    </div>
  );
}
