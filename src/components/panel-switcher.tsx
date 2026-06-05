"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ChevronDown, Store, LayoutDashboard, Zap, X } from "lucide-react";

const PANELS = [
  {
    href:  "/",
    label: "Store",
    desc:  "Customer-facing shop",
    icon:  Store,
    color: "bg-green-500",
    ring:  "ring-green-500/30",
    text:  "text-green-700",
    bg:    "bg-green-50",
  },
  {
    href:  "/admin",
    label: "Admin",
    desc:  "Products, analytics, settings",
    icon:  LayoutDashboard,
    color: "bg-indigo-500",
    ring:  "ring-indigo-500/30",
    text:  "text-indigo-700",
    bg:    "bg-indigo-50",
  },
  {
    href:  "/cord",
    label: "Cord",
    desc:  "Live order management",
    icon:  Zap,
    color: "bg-orange-500",
    ring:  "ring-orange-500/30",
    text:  "text-orange-700",
    bg:    "bg-orange-50",
  },
] as const;

interface Props {
  current: "store" | "admin" | "cord";
  dark?: boolean;
}

const DROPDOWN_W = 256; // w-64 = 16rem = 256px
const GAP        = 6;   // gap between trigger bottom and dropdown top

export function PanelSwitcher({ current, dark }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, left: 0 });
  const btnRef          = useRef<HTMLButtonElement>(null);

  const active = PANELS.find(p =>
    current === "store" ? p.href === "/" :
    current === "admin" ? p.href === "/admin" : p.href === "/cord"
  )!;
  const Icon = active.icon;

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const r    = btnRef.current.getBoundingClientRect();
      const vw   = window.innerWidth;
      // Prefer right-aligned to trigger; clamp so it never leaves the viewport
      let left   = r.right - DROPDOWN_W;
      if (left < 8)              left = Math.min(r.left, vw - DROPDOWN_W - 8);
      if (left + DROPDOWN_W > vw - 8) left = vw - DROPDOWN_W - 8;
      setPos({ top: r.bottom + GAP, left: Math.max(8, left) });
    }
    setOpen(v => !v);
  };

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-colors text-xs font-semibold ${
          dark
            ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        }`}
      >
        <div className={`w-4 h-4 ${active.color} rounded flex items-center justify-center`}>
          <Icon size={9} className="text-white" />
        </div>
        {active.label}
        <ChevronDown
          size={12}
          className={open ? "rotate-180 transition-transform" : "transition-transform"}
        />
      </button>

      {open && (
        <>
          {/* Backdrop — closes dropdown on outside click */}
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />

          {/* Dropdown — fixed so it escapes any parent overflow/stacking context */}
          <div
            style={{ top: pos.top, left: pos.left, width: DROPDOWN_W }}
            className="fixed z-[100] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-up"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Switch Panel
              </p>
              <button
                onClick={() => setOpen(false)}
                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X size={13} />
              </button>
            </div>

            {PANELS.map(panel => {
              const PIcon    = panel.icon;
              const isCurrent =
                (current === "store" && panel.href === "/") ||
                (current === "admin" && panel.href === "/admin") ||
                (current === "cord"  && panel.href === "/cord");

              return (
                <Link
                  key={panel.href}
                  href={panel.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${
                    isCurrent ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <div
                    className={`w-9 h-9 ${panel.color} rounded-xl flex items-center justify-center shadow-sm ring-4 ${
                      isCurrent ? panel.ring : "ring-transparent"
                    } shrink-0`}
                  >
                    <PIcon size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{panel.label}</p>
                    <p className="text-xs text-gray-400 truncate">{panel.desc}</p>
                  </div>
                  {isCurrent && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${panel.bg} ${panel.text}`}
                    >
                      Current
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
