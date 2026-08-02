"use client";

import { DESCRIPTION_MAX, DESCRIPTION_MIN, TITLE_MAX, TITLE_MIN, gradeLength, truncate } from "@/lib/seoAutogen";

/**
 * Live SERP and social previews, shared by the product SEO tab and the SEO
 * dashboard's page/entity editors.
 *
 * These render what the *search engine* will show, not what the admin typed:
 * the title and snippet are truncated exactly the way Google truncates them, so
 * an over-long title visibly loses its tail here rather than silently getting
 * cut in production. That's the whole point of the preview — an honest one is
 * useful, a flattering one is not.
 */

const GRADE_STYLES = {
  good: "bg-positive",
  warn: "bg-signal",
  bad: "bg-ember",
} as const;

const GRADE_LABEL = {
  good: "Good length",
  warn: "Outside the ideal range",
  bad: "Empty",
} as const;

/**
 * Character counter with a fill bar. Deliberately not a hard limit — an admin
 * with a good reason to exceed it should be warned, not blocked.
 */
export function LengthMeter({ value, min, max, label }: { value: string; min: number; max: number; label: string }) {
  const length = value.trim().length;
  const grade = gradeLength(value, min, max);
  const percent = Math.min(100, (length / max) * 100);

  return (
    <div className="mt-1.5">
      <div className="flex items-center justify-between text-[11px] text-ink-soft">
        <span>
          {label}: <span className="font-mono-tab">{length}</span> / {max}
        </span>
        <span>{GRADE_LABEL[grade]}</span>
      </div>
      <div className="mt-1 h-1 w-full bg-stone-200">
        <div className={`h-1 ${GRADE_STYLES[grade]}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

/** Renders the breadcrumb-style URL Google shows instead of the raw path. */
function displayUrl(path: string): string {
  const clean = path.replace(/^https?:\/\//, "").replace(/^\//, "");
  return ["hector1984.com", ...clean.split("/").filter(Boolean)].join(" › ");
}

export function SerpPreview({ title, description, path }: { title: string; description: string; path: string }) {
  return (
    <div className="border border-stone-300 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Google search preview</p>
      <div className="mt-3 max-w-[600px] font-sans">
        <p className="truncate text-xs text-[#4d5156]">{displayUrl(path)}</p>
        <p className="mt-0.5 text-[18px] leading-snug text-[#1a0dab]">
          {truncate(title || "Untitled page", TITLE_MAX)}
        </p>
        <p className="mt-0.5 text-[13px] leading-snug text-[#4d5156]">
          {description ? truncate(description, DESCRIPTION_MAX) : "No meta description — Google will invent one from the page copy."}
        </p>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <LengthMeter value={title} min={TITLE_MIN} max={TITLE_MAX} label="Title" />
        <LengthMeter value={description} min={DESCRIPTION_MIN} max={DESCRIPTION_MAX} label="Description" />
      </div>
    </div>
  );
}

export function SocialPreview({
  title,
  description,
  imageUrl,
  card = "summary_large_image",
  network,
}: {
  title: string;
  description: string;
  imageUrl?: string;
  card?: string;
  network: "Open Graph" | "X / Twitter";
}) {
  const large = card === "summary_large_image";

  return (
    <div className="border border-stone-300 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{network} preview</p>
      <div className={`mt-2 overflow-hidden border border-stone-300 ${large ? "max-w-sm" : "flex max-w-sm items-stretch"}`}>
        <div className={large ? "relative aspect-[1.91/1] w-full bg-stone-200" : "relative aspect-square w-24 shrink-0 bg-stone-200"}>
          {imageUrl ? (
            // Arbitrary admin-supplied URLs (including Supabase Storage) — plain
            // <img> via next/image's `unoptimized` escape hatch would still need
            // the host allow-listed, so this preview uses a background-image
            // style instead of failing to render entirely.
            <span
              role="img"
              aria-label={`${network} share image preview`}
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url("${imageUrl.replace(/"/g, "%22")}")` }}
            />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-[10px] uppercase tracking-wide text-ink-soft">
              No image
            </span>
          )}
        </div>
        <div className="min-w-0 p-2">
          <p className="truncate text-[11px] uppercase tracking-wide text-ink-soft">hector1984.com</p>
          <p className="truncate text-sm font-semibold text-ink">{title || "Untitled"}</p>
          <p className="line-clamp-2 text-xs text-ink-soft">{description}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Read-only JSON-LD viewer. Shows the admin exactly what will be emitted, and
 * links out to Google's Rich Results Test — validation genuinely belongs at
 * Google's end, and pretending to validate schema locally would give false
 * confidence.
 */
export function StructuredDataPreview({ schema, testUrl }: { schema: unknown; testUrl?: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Structured data (JSON-LD) — generated from live product data
        </p>
        {testUrl && (
          <a
            href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(testUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] underline underline-offset-2 hover:text-ink"
          >
            Test in Google
          </a>
        )}
      </div>
      <pre className="scroll-thin max-h-56 overflow-auto border border-stone-300 bg-stone-100 p-3 text-xs text-ink-soft">
        {JSON.stringify(schema, null, 2)}
      </pre>
    </div>
  );
}
