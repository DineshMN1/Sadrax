"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Zap, ChevronRight } from "lucide-react";
import { getBannerTheme } from "@/lib/banner-themes";
import type { Banner } from "@/lib/db/schema";

const AUTO_ADVANCE_MS = 4500;

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Track which slide is centred as the user swipes.
  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActive(idx);
  };

  // Auto-advance, looping back to the first slide. Pauses while the tab is
  // hidden and resets whenever the active slide changes (incl. manual swipes).
  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setTimeout(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const next = (active + 1) % banners.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(id);
  }, [active, banners.length]);

  const goTo = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  if (banners.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none [&::-webkit-scrollbar]:hidden -mx-4 px-4 md:mx-0 md:px-0 gap-3"
      >
        {banners.map((b) => (
          <BannerSlide key={b.id} banner={b} />
        ))}
      </div>

      {banners.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {banners.map((b, i) => (
            <button
              key={b.id}
              onClick={() => goTo(i)}
              aria-label={`Go to banner ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-5 bg-green-600" : "w-1.5 bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BannerSlide({ banner }: { banner: Banner }) {
  const theme = getBannerTheme(banner.theme);
  const hasImage = !!banner.image;

  // Image promo banner — the artwork is the whole banner, no overlay text.
  const inner = hasImage ? (
    <div className="relative rounded-3xl overflow-hidden aspect-3/1 bg-gray-100 shadow-xl">
      <Image
        src={banner.image!}
        alt={banner.title ?? "Promotion"}
        fill
        sizes="(max-width: 768px) 100vw, 768px"
        className="object-contain"
        priority
      />
    </div>
  ) : (
    // Text/gradient banner (used when no artwork is uploaded)
    <div className={`relative rounded-3xl p-5 overflow-hidden flex items-center shadow-xl min-h-32.5 ${theme.gradient} shadow-green-700/20`}>
      <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-sm" />
      <div className="absolute -right-2 -bottom-12 w-32 h-32 bg-white/10 rounded-full" />
      <div className="absolute right-16 top-4 w-12 h-12 bg-white/10 rounded-full" />

      <div className="relative z-10 flex-1">
        {banner.badge && (
          <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full mb-2.5 backdrop-blur-sm ${theme.badgeBg}`}>
            <Zap size={10} fill="currentColor" />
            {banner.badge}
          </div>
        )}
        {banner.title && (
          <h2 className={`text-xl font-extrabold leading-tight mb-1 ${theme.text}`}>{banner.title}</h2>
        )}
        {banner.subtitle && <p className={`text-xs mb-3.5 ${theme.sub}`}>{banner.subtitle}</p>}
        {banner.ctaText && (
          <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-4 py-2 rounded-xl transition-colors shadow-sm ${theme.ctaBg}`}>
            {banner.ctaText} <ChevronRight size={12} strokeWidth={3} />
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="snap-center shrink-0 w-full">
      {banner.ctaLink ? (
        <Link href={banner.ctaLink} className="block active:scale-[0.99] transition-transform">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </div>
  );
}
