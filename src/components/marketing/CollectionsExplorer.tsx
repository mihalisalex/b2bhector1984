"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { AvailabilityBadge } from "@/components/ui/Badge";
import { StylePlate } from "@/components/product/StylePlate";
import { getStyleImageUrl } from "@/lib/data/styleLabels";
import { withLocale } from "@/i18n/paths";
import { t } from "@/i18n/format";
import type { Locale } from "@/i18n/config";
import type { Category, Season, Style } from "@/lib/types";

type SortKey = "newest" | "featured" | "name";

interface Dict {
  filterLabel: string;
  filterAll: string;
  sortLabel: string;
  sortNewest: string;
  sortFeatured: string;
  sortNameAsc: string;
  resultsCount: string;
  signInForPricing: string;
  noResults: string;
}

/**
 * All the interactive parts of /collections — season toggle, category filter, sort, and
 * the product grid — as one client component. Everything is filtered/sorted from the
 * single already-fetched `styles` array already sitting in the browser, so switching
 * season/filter/sort is instant (no navigation, no server round-trip); the URL is kept in
 * sync via `router.replace` purely so the current view stays shareable/bookmarkable and
 * survives a reload, not because anything waits on it.
 *
 * Takes the real `Style[]` (not a trimmed-down shape) so `AvailabilityBadge` — which reads
 * `style.availableBoxTypes` — keeps working correctly without a fragile partial re-cast.
 */
export function CollectionsExplorer({
  styles,
  seasonOptions,
  categoryLabel,
  locale,
  dict,
  initialSeason,
  initialCategory,
}: {
  styles: Style[];
  seasonOptions: { value: Season; label: string }[];
  categoryLabel: Record<Category, string>;
  locale: Locale;
  dict: Dict;
  initialSeason?: Season;
  initialCategory?: Category;
}) {
  const router = useRouter();
  const [season, setSeason] = useState<Season>(initialSeason ?? seasonOptions[0]?.value ?? "summer");
  const [category, setCategory] = useState<Category | null>(initialCategory ?? null);
  const [sort, setSort] = useState<SortKey>("newest");

  // A "both" style belongs to Summer and Winter at once — see StyleSeason's doc comment.
  const inSeason = useMemo(
    () => styles.filter((s) => s.season === season || s.season === "both"),
    [styles, season],
  );

  const categoryCounts = useMemo(() => {
    const counts = new Map<Category, number>();
    for (const s of inSeason) counts.set(s.category, (counts.get(s.category) ?? 0) + 1);
    return counts;
  }, [inSeason]);

  // Only ever offer a category that actually has stock this season — no dead filter chips
  // for a taxonomy category (e.g. Wedding, Anatomic) that happens to have zero live styles.
  const availableCategories = useMemo(
    () => (Object.keys(categoryLabel) as Category[]).filter((c) => (categoryCounts.get(c) ?? 0) > 0),
    [categoryCounts, categoryLabel],
  );

  // A category chosen under a different season (or one that's since sold through) just
  // quietly stops applying rather than showing an empty grid.
  const activeCategory = category && categoryCounts.has(category) ? category : null;

  const results = useMemo(() => {
    const filtered = activeCategory ? inSeason.filter((s) => s.category === activeCategory) : inSeason;
    const list = [...filtered];
    if (sort === "newest") list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sort === "featured") list.sort((a, b) => Number(b.featured) - Number(a.featured));
    else list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [inSeason, activeCategory, sort]);

  function syncUrl(nextSeason: Season, nextCategory: Category | null) {
    const params = new URLSearchParams({ season: nextSeason });
    if (nextCategory) params.set("category", nextCategory);
    router.replace(`${withLocale(locale, "/collections")}?${params.toString()}`, { scroll: false });
  }

  function selectSeason(next: Season) {
    setSeason(next);
    setCategory(null);
    syncUrl(next, null);
  }

  function selectCategory(next: Category | null) {
    setCategory(next);
    syncUrl(season, next);
  }

  const seasonIndex = Math.max(
    seasonOptions.findIndex((o) => o.value === season),
    0,
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {seasonOptions.length > 1 && (
          <div
            role="tablist"
            aria-label="Season"
            className="relative grid shrink-0 rounded-full border border-stone-300 bg-white p-0.5"
            style={{ gridTemplateColumns: `repeat(${seasonOptions.length}, minmax(0, 1fr))` }}
          >
            <div
              aria-hidden
              className="absolute inset-y-0.5 left-0.5 rounded-full bg-ink transition-transform duration-300 ease-out"
              style={{
                width: `calc(${100 / seasonOptions.length}% - 4px)`,
                transform: `translateX(calc(${seasonIndex} * (100% + 4px)))`,
              }}
            />
            {seasonOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={season === opt.value}
                onClick={() => selectSeason(opt.value)}
                className={cn(
                  "relative z-10 whitespace-nowrap rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wide transition-colors duration-300",
                  season === opt.value ? "text-white" : "text-ink-soft hover:text-ink",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <PillDropdown
          label={activeCategory ? categoryLabel[activeCategory] : dict.filterLabel}
          active={Boolean(activeCategory)}
        >
          {(close) => (
            <>
              <DropdownOption
                active={!activeCategory}
                label={dict.filterAll}
                onClick={() => {
                  selectCategory(null);
                  close();
                }}
              />
              {availableCategories.map((c) => (
                <DropdownOption
                  key={c}
                  active={activeCategory === c}
                  label={`${categoryLabel[c]} (${categoryCounts.get(c)})`}
                  onClick={() => {
                    selectCategory(c);
                    close();
                  }}
                />
              ))}
            </>
          )}
        </PillDropdown>

        <PillDropdown label={`${dict.sortLabel}: ${sortLabel(sort, dict)}`} active={sort !== "newest"}>
          {(close) => (
            <>
              <DropdownOption
                active={sort === "newest"}
                label={dict.sortNewest}
                onClick={() => {
                  setSort("newest");
                  close();
                }}
              />
              <DropdownOption
                active={sort === "featured"}
                label={dict.sortFeatured}
                onClick={() => {
                  setSort("featured");
                  close();
                }}
              />
              <DropdownOption
                active={sort === "name"}
                label={dict.sortNameAsc}
                onClick={() => {
                  setSort("name");
                  close();
                }}
              />
            </>
          )}
        </PillDropdown>

        <span className="ml-auto font-mono-tab text-xs text-ink-soft">{t(dict.resultsCount, { count: results.length })}</span>
      </div>

      <div
        key={`${season}-${activeCategory ?? "all"}-${sort}`}
        className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 [animation:grid-fade-up_400ms_ease-out] sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3"
      >
        {results.map((style) => (
          <Link key={style.id} href={withLocale(locale, `/product/${style.slug}`)} className="group block">
            <div className="relative overflow-hidden bg-stone-100">
              <StylePlate
                swatch={style.colorways[0].swatch}
                imageUrl={getStyleImageUrl(style)}
                alt={style.name}
                className="aspect-[4/5] w-full transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
              <div className="absolute left-2 top-2">
                <AvailabilityBadge style={style} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="font-display text-sm font-semibold uppercase tracking-tight text-ink transition-colors group-hover:text-signal sm:text-base">
                {style.name}
              </h3>
              <p className="mt-0.5 text-xs text-ink-soft">{categoryLabel[style.category]}</p>
            </div>
          </Link>
        ))}
      </div>

      {results.length === 0 && <p className="mt-16 text-center text-sm text-ink-soft">{dict.noResults}</p>}
    </div>
  );
}

function sortLabel(sort: SortKey, dict: Dict): string {
  if (sort === "featured") return dict.sortFeatured;
  if (sort === "name") return dict.sortNameAsc;
  return dict.sortNewest;
}

const PANEL_WIDTH = 208;

/**
 * Small trigger + portal panel. Deliberately NOT `useDropdownPanel` (the header's shared
 * hook, used by LanguageSwitcher/AccountMenu) — that hook anchors the panel from the
 * viewport's *right* edge, which is correct for header controls that always sit near the
 * right edge, but these Filter/Sort buttons sit left-of-center under the season toggle on
 * mobile. Anchoring from the right there pushed the panel's left edge into negative
 * coordinates — visually clipped off the left side of the screen (caught in browser
 * testing, not just a theoretical concern). This positions from the button's own left
 * edge instead, clamped so it can't run off either edge of the viewport.
 */
function PillDropdown({
  label,
  active,
  children,
}: {
  label: string;
  active: boolean;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = buttonRef.current?.getBoundingClientRect();
      if (!r) return;
      const left = Math.min(Math.max(r.left, 8), window.innerWidth - PANEL_WIDTH - 8);
      setPos({ top: r.bottom + 8, left });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-xs font-semibold uppercase tracking-wide transition-colors",
          active ? "border-ink bg-ink text-white" : "border-stone-300 text-ink-soft hover:border-ink hover:text-ink",
        )}
      >
        {label}
        <span aria-hidden className={cn("text-[10px] transition-transform duration-200", open && "rotate-180")}>
          ▾
        </span>
      </button>

      {mounted &&
        open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            style={{ top: pos.top, left: pos.left, width: PANEL_WIDTH }}
            className="fixed z-50 border border-stone-300 bg-stone-50 py-1.5 shadow-[0_18px_44px_rgba(0,0,0,0.16)]"
          >
            {children(() => setOpen(false))}
          </div>,
          document.body,
        )}
    </>
  );
}

function DropdownOption({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between px-4 py-2 text-left text-sm font-medium transition-colors",
        active ? "bg-stone-100 text-ink" : "text-ink-soft hover:bg-stone-100 hover:text-ink",
      )}
    >
      {label}
      {active && <span aria-hidden>✓</span>}
    </button>
  );
}
