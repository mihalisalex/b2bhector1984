"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { searchStylesAction, type SearchResult } from "@/lib/searchActions";
import { formatEUR } from "@/lib/pricing";
import { cn } from "@/lib/cn";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { IconButton } from "@/components/ui/IconButton";

const RECENT_KEY = "hector_recent_searches";
const MAX_RECENT = 6;

const POPULAR_CATEGORIES = [
  { value: "loafers", label: "Loafers" },
  { value: "boots", label: "Boots" },
  { value: "sneakers", label: "Sneakers" },
  { value: "formal", label: "Formal" },
];

function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function pushRecent(query: string) {
  try {
    const next = [query, ...readRecent().filter((q) => q.toLowerCase() !== query.toLowerCase())].slice(0, MAX_RECENT);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable — recent searches just won't persist, non-critical
  }
}

/** Trigger icon button + portal-rendered instant-search overlay, self-contained so it can
 * drop into ShopHeader (a server component) without lifting any state up. */
export function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // The focus timer below is already cleaned up by the open-effect; this covers the
  // search debounce, which outlives a close/unmount and would otherwise run a server
  // action for a query nobody is waiting on any more.
  useEffect(() => () => clearTimeout(debounceRef.current), []);
  const requestIdRef = useRef(0);
  const router = useRouter();

  useFocusTrap(dialogRef, open);

  // Portal target isn't available during SSR; the overlay renders after mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a browser-only API (localStorage) when the overlay opens
    setRecent(readRecent());
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  function runSearch(value: string) {
    setQuery(value);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const requestId = ++requestIdRef.current;
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await searchStylesAction(value);
        if (requestId !== requestIdRef.current) return; // a newer search superseded this one
        setResults(r);
      } catch (err) {
        console.error("Search failed:", err);
        if (requestId !== requestIdRef.current) return;
        setResults([]);
      } finally {
        if (requestId === requestIdRef.current) {
          setSearched(true);
          setLoading(false);
        }
      }
    }, 200);
  }

  function go(result: SearchResult) {
    pushRecent(query.trim());
    setOpen(false);
    setQuery("");
    setResults([]);
    setSearched(false);
    router.push(`/product/${result.slug}`);
  }

  function submitPlainQuery(value: string) {
    if (!value.trim()) return;
    pushRecent(value.trim());
    setOpen(false);
    router.push(`/catalogue?q=${encodeURIComponent(value.trim())}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(-1, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) go(results[activeIndex]);
      else submitPlainQuery(query);
    }
  }

  return (
    <>
      <IconButton onClick={() => setOpen(true)} aria-label="Search products">
        <SearchIcon />
      </IconButton>

      {mounted &&
        createPortal(
          <div
            className={cn(
              "fixed inset-0 z-[60] bg-ink/40 transition-opacity",
              open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
            )}
            onClick={() => setOpen(false)}
            // `inert`, not just `aria-hidden`. The closed overlay is hidden only
            // visually (opacity-0 + pointer-events-none), which stops the mouse but not
            // the keyboard: its search input, close button and four category buttons
            // stayed in the tab order, so tabbing through the header landed on invisible
            // controls with no visible focus (WCAG 2.4.3/2.4.7). `aria-hidden` alone
            // can't fix that — it hides from screen readers while leaving elements
            // focusable, which is itself an ARIA violation. `inert` removes the subtree
            // from both the tab order and the accessibility tree.
            inert={!open}
          >
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label="Search"
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "mx-auto mt-0 flex max-h-screen w-full max-w-2xl flex-col bg-stone-50 shadow-[0_20px_60px_rgba(0,0,0,0.25)] transition-transform duration-200 sm:mt-20 sm:max-h-[80vh]",
                open ? "translate-y-0" : "-translate-y-4",
              )}
            >
              <div className="flex items-center gap-2 border-b border-stone-300 p-3">
                <SearchIcon className="ml-1 shrink-0 text-ink-soft" />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => runSearch(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Search by style name, SKU, or category"
                  aria-label="Search products"
                  aria-activedescendant={activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
                  role="combobox"
                  aria-expanded={results.length > 0}
                  aria-controls="search-results-list"
                  className="w-full bg-transparent px-1 py-1.5 text-base text-ink outline-none placeholder:text-ink-soft"
                />
                <IconButton size="sm" onClick={() => setOpen(false)} aria-label="Close search">
                  ✕
                </IconButton>
              </div>

              <div className="scroll-thin overflow-y-auto p-3">
                {!query.trim() && (
                  <div className="space-y-5">
                    {recent.length > 0 && (
                      <div>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Recent searches</p>
                        <div className="flex flex-wrap gap-2">
                          {recent.map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => runSearch(r)}
                              className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs text-ink hover:border-ink"
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Popular categories</p>
                      <div className="flex flex-wrap gap-2">
                        {POPULAR_CATEGORIES.map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => {
                              setOpen(false);
                              router.push(`/catalogue?category=${c.value}`);
                            }}
                            className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs text-ink hover:border-ink"
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {query.trim() && loading && <p className="px-1 py-6 text-center text-sm text-ink-soft">Searching…</p>}

                {query.trim() && !loading && searched && results.length === 0 && (
                  <div className="px-1 py-6 text-center">
                    <p className="text-sm text-ink-soft">No matches for &ldquo;{query}&rdquo;.</p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      {POPULAR_CATEGORIES.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            router.push(`/catalogue?category=${c.value}`);
                          }}
                          className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs text-ink hover:border-ink"
                        >
                          Browse {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {results.length > 0 && (
                  <ul id="search-results-list" role="listbox" className="flex flex-col gap-1">
                    {results.map((r, i) => (
                      <li key={r.id} id={`search-result-${i}`} role="option" aria-selected={i === activeIndex}>
                        <button
                          type="button"
                          onClick={() => go(r)}
                          onMouseEnter={() => setActiveIndex(i)}
                          className={cn(
                            "flex w-full items-center gap-3 border border-transparent p-2 text-left transition-colors",
                            i === activeIndex ? "border-stone-300 bg-white" : "hover:bg-white",
                          )}
                        >
                          <span className="relative h-12 w-12 shrink-0 overflow-hidden bg-stone-200">
                            <Image src={r.imageUrl} alt="" fill sizes="48px" className="object-cover" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-ink">{r.name}</span>
                            <span className="font-mono-tab block text-[11px] text-ink-soft">{r.styleNumber}</span>
                          </span>
                          <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">{formatEUR(r.price)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {query.trim() && !loading && (
                  <button
                    type="button"
                    onClick={() => submitPlainQuery(query)}
                    className="mt-2 w-full border-t border-stone-200 pt-3 text-left text-xs font-semibold uppercase tracking-wide text-signal hover:underline"
                  >
                    See all results for &ldquo;{query}&rdquo; →
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-5 w-5", className)} fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="m21 21-4.3-4.3" />
    </svg>
  );
}
