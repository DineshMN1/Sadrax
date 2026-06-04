"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";

interface Suggestion {
  id: number;
  name: string;
  price: number;
  images: string[] | null;
  unit: string | null;
}

const RECENT_KEY = "sadrax_recent_searches";
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); } catch { return []; }
}
function saveSearch(q: string) {
  try {
    const list = [q, ...getRecentSearches().filter(s => s !== q)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch { /* ignore */ }
}

export function SearchBar({ className }: { className?: string }) {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue]           = useState(searchParams.get("q") ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recentSearches, setRecent]   = useState<string[]>([]);
  const [open, setOpen]              = useState(false);
  const [loading, setLoading]        = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent searches when dropdown opens
  useEffect(() => {
    if (open && value.trim() === "") {
      setRecent(getRecentSearches());
    }
  }, [open, value]);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/products?q=${encodeURIComponent(q)}&limit=6`);
      const data = await res.json();
      setSuggestions(data.products ?? []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (v: string) => {
    setValue(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.trim().length >= 2) {
      debounceRef.current = setTimeout(() => fetchSuggestions(v), 280);
    } else {
      setSuggestions([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    saveSearch(q);
    setOpen(false);
    inputRef.current?.blur();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const handlePickSuggestion = (p: Suggestion) => {
    saveSearch(p.name);
    setOpen(false);
    router.push(`/product/${p.id}`);
  };

  const handlePickRecent = (q: string) => {
    setValue(q);
    saveSearch(q);
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleClear = () => {
    setValue("");
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const showDropdown = open && (suggestions.length > 0 || (value.trim() === "" && recentSearches.length > 0));

  return (
    <div className={cn("relative", className)}>
      <form onSubmit={handleSubmit}>
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search groceries, brands..."
          className="w-full h-11 pl-10 pr-10 rounded-xl bg-gray-100 text-sm text-gray-900 placeholder:text-gray-400 border border-transparent focus:border-green-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-400/20 transition-all"
        />
        {value && (
          <button type="button" onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10">
            <X size={16} />
          </button>
        )}
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute top-13 left-0 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 z-30 overflow-hidden animate-slide-up max-h-80 overflow-y-auto">

            {/* Recent searches (when input is empty) */}
            {value.trim() === "" && recentSearches.length > 0 && (
              <div>
                <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recent</p>
                  <button onClick={() => { localStorage.removeItem(RECENT_KEY); setRecent([]); }}
                    className="text-[10px] text-gray-400 hover:text-gray-600 font-semibold">Clear</button>
                </div>
                {recentSearches.map(q => (
                  <button key={q} onClick={() => handlePickRecent(q)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                    <Clock size={13} className="text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-700 flex-1 min-w-0 truncate">{q}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Product suggestions */}
            {suggestions.length > 0 && (
              <div>
                {value.trim() !== "" && (
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Products</p>
                  </div>
                )}
                {suggestions.map(p => (
                  <button key={p.id} onClick={() => handlePickSuggestion(p)}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                      {p.images?.[0]
                        ? <Image src={p.images[0]} alt={p.name} width={40} height={40} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-xl">🛒</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                      {p.unit && <p className="text-xs text-gray-400">{p.unit}</p>}
                    </div>
                    <span className="text-sm font-bold text-gray-900 shrink-0">{formatPrice(p.price)}</span>
                  </button>
                ))}

                {/* Search all */}
                {value.trim().length >= 2 && (
                  <button onClick={handleSubmit as unknown as React.MouseEventHandler}
                    className="w-full flex items-center gap-3 px-4 py-3 border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                      <Search size={16} className="text-green-600" />
                    </div>
                    <span className="text-sm font-semibold text-green-700">
                      Search all results for &quot;{value}&quot;
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="px-4 py-3 text-xs text-gray-400 text-center">Searching…</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
