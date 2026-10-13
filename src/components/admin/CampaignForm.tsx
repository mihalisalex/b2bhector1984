"use client";

import { useActionState, useMemo, useState } from "react";
import { sendCampaign, type CampaignState } from "@/lib/campaignActions";
import {
  buildCampaignHtml,
  campaignImageUrl,
  campaignLinks,
  generateCampaignText,
  splitStyleName,
  CAMPAIGN_MAX_STYLES,
  type CampaignLang,
  type CampaignPreset,
  type CampaignStyle,
  type CampaignText,
} from "@/lib/campaignEmail";
import { CAMPAIGN_COPY_TO, WHATSAPP_NUMBER } from "@/lib/contact";
import type { StyleSeason } from "@/lib/types";

const INPUT = "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-ink outline-none focus-visible:border-ink";
const LABEL = "grid gap-1.5 text-xs font-medium text-ink-soft";
const STEP = "text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft";

/** Styles shown before "Show all" — three rows on a laptop. */
const PICKER_PAGE = 12;

/** How many styles a blank campaign starts with — the newest few. */
const DEFAULT_PICK = 6;

type SeasonFilter = "all" | StyleSeason;
const SEASON_FILTERS: { value: SeasonFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "winter", label: "Winter" },
  { value: "summer", label: "Summer" },
  { value: "both", label: "All-season" },
];

/**
 * Admin campaign builder (see sendCampaign): pick styles, generate or write the text, watch
 * the live preview, send a test, send to every buyer. The preview is the real email — the
 * same `buildCampaignHtml` the server sends.
 */
export function CampaignForm({
  styles,
  presets,
  initialPresetId,
  buyerCount,
  adminEmail,
  adminName,
}: {
  /** Every live style, newest first. */
  styles: CampaignStyle[];
  presets: CampaignPreset[];
  initialPresetId?: string;
  buyerCount: number;
  adminEmail: string;
  adminName: string;
}) {
  const newest = (season: SeasonFilter, count: number) =>
    styles.filter((s) => season === "all" || s.season === season).slice(0, count);
  const initialPreset = presets.find((p) => p.id === initialPresetId);

  const [state, formAction, pending] = useActionState(sendCampaign, {} as CampaignState);
  const [presetId, setPresetId] = useState(initialPreset?.id ?? "");
  const [filter, setFilter] = useState<SeasonFilter>(initialPreset?.season ?? "all");
  const [picked, setPicked] = useState<string[]>(() =>
    (initialPreset ? newest(initialPreset.season ?? "all", initialPreset.count) : newest("all", DEFAULT_PICK)).map((s) => s.id),
  );
  const [lang, setLang] = useState<CampaignLang>(initialPreset?.lang ?? "el");
  const [version, setVersion] = useState(0);
  const [text, setText] = useState<CampaignText>(() => initialPreset?.text ?? generateCampaignText(newest("all", DEFAULT_PICK), "el", 0));
  const [copied, setCopied] = useState(false);

  const [showAll, setShowAll] = useState(false);
  const visible = styles.filter((s) => filter === "all" || s.season === filter);
  // Picked styles always stay on screen, even when they're past the first page.
  const shown = showAll ? visible : visible.filter((s, i) => i < PICKER_PAGE || picked.includes(s.id));

  const pickedStyles = useMemo(
    () => picked.map((id) => styles.find((s) => s.id === id)).filter((s): s is CampaignStyle => Boolean(s)),
    [picked, styles],
  );
  const preview = useMemo(
    () =>
      buildCampaignHtml({ lang, text, styles: pickedStyles, links: campaignLinks(lang), contactName: adminName, whatsapp: WHATSAPP_NUMBER }),
    [lang, text, pickedStyles, adminName],
  );

  const toggle = (id: string) =>
    setPicked((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : current.length < CAMPAIGN_MAX_STYLES ? [...current, id] : current,
    );
  // The offer line (and the button link that goes with it) is the owner's own — generating
  // new text never overwrites it.
  const generate = (nextLang = lang, nextVersion = version + 1) => {
    setVersion(nextVersion);
    setText((current) => ({ ...generateCampaignText(pickedStyles, nextLang, nextVersion), offer: current.offer, ctaPath: current.ctaPath }));
  };
  const startFrom = (id: string) => {
    setPresetId(id);
    const preset = presets.find((p) => p.id === id);
    if (preset) {
      setLang(preset.lang);
      setFilter(preset.season ?? "all");
      setPicked(newest(preset.season ?? "all", preset.count).map((s) => s.id));
      setText(preset.text);
    } else {
      const fresh = newest("all", DEFAULT_PICK);
      setFilter("all");
      setPicked(fresh.map((s) => s.id));
      setText(generateCampaignText(fresh, lang, 0));
      setVersion(0);
    }
  };
  const switchLang = (next: CampaignLang) => {
    if (next === lang) return;
    setLang(next);
    generate(next, version);
  };
  const edit = (key: keyof CampaignText) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setText((current) => ({ ...current, [key]: e.target.value }));

  return (
    <form action={formAction} className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
      <input type="hidden" name="language" value={lang} />
      <input type="hidden" name="ctaPath" value={text.ctaPath ?? ""} />
      {picked.map((id) => (
        <input key={id} type="hidden" name="styleIds" value={id} />
      ))}

      <div className="grid gap-10">
        {presets.length > 0 && (
          <label className={LABEL}>
            Start from
            <select value={presetId} onChange={(e) => startFrom(e.target.value)} className={`${INPUT} max-w-md`}>
              <option value="">New styles (blank — generate the text)</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  Ready-made: {p.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* 1 — styles */}
        <section className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className={STEP}>1 · Styles</p>
            <p className="text-xs text-ink-soft">
              {picked.length} of {CAMPAIGN_MAX_STYLES} picked · newest first
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-full border border-stone-300 p-0.5 text-xs font-semibold">
              {SEASON_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  className={`rounded-full px-3 py-1.5 ${filter === f.value ? "bg-ink text-white" : "text-ink-soft hover:text-ink"}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPicked(visible.slice(0, CAMPAIGN_MAX_STYLES).map((s) => s.id))}
              className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink"
            >
              Pick the newest {Math.min(CAMPAIGN_MAX_STYLES, visible.length)}
            </button>
            {picked.length > 0 && (
              <button type="button" onClick={() => setPicked([])} className="px-2 text-xs font-semibold text-ink-soft underline hover:text-ink">
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 items-start gap-2 sm:grid-cols-4">
            {shown.map((s) => {
              const position = picked.indexOf(s.id);
              const on = position >= 0;
              const full = !on && picked.length >= CAMPAIGN_MAX_STYLES;
              const { code, detail } = splitStyleName(s.name);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(s.id)}
                  disabled={full}
                  aria-pressed={on}
                  className={`relative flex min-w-0 flex-col rounded-lg border bg-white text-left transition ${
                    on ? "border-ink ring-1 ring-ink" : "border-stone-200 hover:border-stone-400"
                  } ${full ? "opacity-35" : ""}`}
                >
                  {/* Fixed square photo box: the tile can never be squeezed shorter than its photo. */}
                  <span className="relative block aspect-square w-full shrink-0 overflow-hidden rounded-t-lg bg-stone-100">
                    {s.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail
                      <img src={campaignImageUrl(s.imageUrl, 240)} alt="" className="absolute inset-0 h-full w-full object-contain" />
                    )}
                  </span>
                  <span className="block shrink-0 px-2 py-1.5">
                    <span className="block truncate text-xs font-semibold text-ink">{code}</span>
                    <span className="block truncate text-[11px] text-ink-soft">{detail || "\u00a0"}</span>
                  </span>
                  {on && (
                    <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-ink text-[11px] font-semibold text-white">
                      {position + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {visible.length > PICKER_PAGE && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="justify-self-start text-xs font-semibold text-ink underline hover:text-ink-soft"
            >
              {showAll ? "Show fewer" : `Show all ${visible.length} styles`}
            </button>
          )}
        </section>

        {/* 2 — text */}
        <section className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className={STEP}>2 · Text</p>
            <div className="flex items-center gap-2">
              <div className="flex rounded-full border border-stone-300 p-0.5 text-xs font-semibold">
                {(["el", "en"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => switchLang(l)}
                    className={`rounded-full px-3 py-1.5 ${lang === l ? "bg-ink text-white" : "text-ink-soft hover:text-ink"}`}
                  >
                    {l === "el" ? "Ελληνικά" : "English"}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => generate()}
                disabled={pickedStyles.length === 0}
                className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white hover:bg-ink/85 disabled:opacity-40"
              >
                ✦ Generate text
              </button>
            </div>
          </div>
          <p className="-mt-2 text-xs text-ink-soft">
            Each press writes a new version from the styles you picked. Change anything you like afterwards.
          </p>
          <label className={LABEL}>
            Subject (what buyers see in their inbox)
            <input name="subject" value={text.subject} onChange={edit("subject")} maxLength={150} className={INPUT} />
          </label>
          <label className={LABEL}>
            Headline (big title — press Enter for a new line)
            <textarea name="headline" value={text.headline} onChange={edit("headline")} rows={2} maxLength={120} className={`${INPUT} text-lg font-bold leading-tight`} />
          </label>
          <label className={LABEL}>
            Offer (optional — a black strip above the photos)
            <input name="offer" value={text.offer ?? ""} onChange={edit("offer")} maxLength={160} placeholder="π.χ. −10% σε όλα τα χειμερινά μοντέλα, έως 31 Οκτωβρίου" className={INPUT} />
          </label>
          <label className={LABEL}>
            Intro (above the photos)
            <textarea name="intro" value={text.intro} onChange={edit("intro")} rows={4} maxLength={1500} className={INPUT} />
          </label>
          <label className={LABEL}>
            Closing (below the button)
            <textarea name="closing" value={text.closing} onChange={edit("closing")} rows={2} maxLength={800} className={INPUT} />
          </label>
        </section>

        {/* 3 — send */}
        <section className="grid gap-4">
          <p className={STEP}>3 · Test, then send</p>
          {state.success && (
            <div className="grid gap-3 rounded-lg border border-positive/40 bg-positive-100 p-4 text-sm" role="status">
              <p className="font-semibold text-positive">{state.success}</p>
              {state.whatsappText && (
                <>
                  <p className="text-xs text-ink-soft">The same message as text, for a WhatsApp broadcast list:</p>
                  <textarea readOnly value={state.whatsappText} rows={8} className={`${INPUT} text-xs`} />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(state.whatsappText!);
                        setCopied(true);
                      } catch {
                        /* select the text manually */
                      }
                    }}
                    className="justify-self-start rounded-full border border-ink px-4 py-2 text-xs font-semibold text-ink hover:bg-ink hover:text-white"
                  >
                    {copied ? "Copied ✓" : "Copy for WhatsApp"}
                  </button>
                </>
              )}
            </div>
          )}
          {state.error && (
            <p role="alert" className="rounded-lg border border-ember/40 bg-ember-100 px-3 py-2 text-sm text-ember">
              {state.error}
            </p>
          )}
          <div className="grid gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm font-semibold text-ink">Send yourself a test</p>
            <div className="flex flex-wrap items-center gap-2">
              <input type="email" name="testEmail" defaultValue={adminEmail} aria-label="Test email address" className={`${INPUT} max-w-xs`} />
              <button
                type="submit"
                name="intent"
                value="test"
                disabled={pending || pickedStyles.length === 0}
                className="rounded-full border border-ink px-5 py-2 text-xs font-semibold text-ink hover:bg-ink hover:text-white disabled:opacity-40"
              >
                {pending ? "Sending…" : "Send test"}
              </button>
            </div>
          </div>
          <div className="grid gap-3 rounded-lg border border-stone-200 p-4">
            <p className="text-sm font-semibold text-ink">Send to all buyers</p>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" name="confirm" className="accent-ink" />
              Yes, email all {buyerCount} buyer{buyerCount === 1 ? "" : "s"} now
            </label>
            <p className="-mt-1 text-xs text-ink-soft">A copy of the real email also goes to {CAMPAIGN_COPY_TO}.</p>
            <div>
              <button
                type="submit"
                name="intent"
                value="send"
                disabled={pending || pickedStyles.length === 0}
                className="rounded-full bg-ink px-6 py-2.5 text-xs font-semibold text-white hover:bg-ink/85 disabled:opacity-40"
              >
                {pending ? "Sending…" : "Send to buyers"}
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* live preview */}
      <aside className="grid gap-2 lg:sticky lg:top-6">
        <p className={STEP}>Preview</p>
        <div className="overflow-hidden rounded-xl border border-stone-300 bg-white shadow-sm">
          <div className="border-b border-stone-200 px-4 py-3">
            <p className="text-[11px] text-ink-soft">Hector Footwear Wholesale</p>
            <p className="truncate text-sm font-semibold text-ink">{text.subject || "—"}</p>
          </div>
          <iframe title="Email preview" srcDoc={preview} sandbox="" className="block h-[720px] w-full" />
        </div>
      </aside>
    </form>
  );
}
