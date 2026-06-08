"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { getCategoryEmoji } from "@/lib/category-emoji";

interface Cat { id: number; name: string; slug: string; image: string | null }

export function CategoryRail({ cats, countMap }: { cats: Cat[]; countMap: Record<number, number> }) {
  const pathname = usePathname();
  const activeSlug = pathname.split("/category/")[1]?.split("/")[0] ?? "";

  // Scroll the active item into view whenever it changes
  const activeRef = useCallback((node: HTMLAnchorElement | null) => {
    if (node) node.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  return (
    <aside className="w-16 md:w-52 shrink-0 border-r border-gray-100 bg-white overflow-y-auto [scroll-behavior:smooth] sticky top-28 self-start max-h-[calc(100dvh-7rem)] pb-28">
      <p className="hidden md:block text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-3 pb-1">
        Categories
      </p>
      {cats.map(c => {
        const active = c.slug === activeSlug;
        return (
          <Link
            key={c.id}
            href={`/category/${c.slug}`}
            prefetch
            ref={active ? activeRef : undefined}
            className={cn(
              "flex flex-col md:flex-row items-center md:items-center gap-0.5 md:gap-2.5 px-1.5 md:px-3 py-2.5 md:py-2 transition-colors border-l-2",
              active
                ? "border-green-500 bg-green-50"
                : "border-transparent hover:bg-gray-50"
            )}
          >
            <span className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
              {c.image
                ? <Image src={c.image} alt={c.name} width={32} height={32} className="w-full h-full object-cover" />
                : <span className="text-base">{getCategoryEmoji(c.slug)}</span>}
            </span>
            <span className={cn(
              "text-center md:text-left text-[10px] md:text-sm leading-tight line-clamp-2 md:flex-1 md:min-w-0 md:truncate",
              active ? "font-bold text-green-700" : "font-medium text-gray-600"
            )}>
              {c.name}
            </span>
            <span className={cn("hidden md:block text-[11px]", active ? "text-green-500" : "text-gray-300")}>
              {countMap[c.id] ?? 0}
            </span>
          </Link>
        );
      })}
    </aside>
  );
}
