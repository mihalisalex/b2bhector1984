import Image from "next/image";
import { getHomepageHero } from "@/lib/data/siteContent";
import {
  updateHomepageHeroAction,
  createHeroImageUploadUrlAction,
  finalizeHeroImageUploadAction,
} from "@/lib/adminActions";
import { isWhatsAppConfigured } from "@/lib/whatsapp";
import { originForLocale } from "@/i18n/domains";
import { ImageUploadForm } from "@/components/admin/ImageUploadForm";

export default async function AdminContentPage() {
  const hero = await getHomepageHero();
  // Every Greek hero field, not just the headline — a hero with Greek copy and an English
  // button reads worse than one that is consistently English, so "complete" means all five.
  const heroGreekComplete = [
    hero.eyebrowEl,
    hero.headingEl,
    hero.bodyEl,
    hero.primaryCtaLabelEl,
    hero.secondaryCtaLabelEl,
  ].every((v) => v.trim().length > 0);
  const whatsappEnabled = isWhatsAppConfigured();

  return (
    <div>
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        Content
      </h1>
      <p className="mt-2 text-sm text-ink-soft">Edit the homepage hero image and copy.</p>

      <div className="mt-6 max-w-xl border border-stone-300 bg-stone-100 p-4 text-xs leading-relaxed text-ink-soft">
        <p className="font-semibold uppercase tracking-wide text-ink">Note — homepage image dimensions</p>
        <p className="mt-2">
          The hero and the season spotlight photos (below, on the homepage — not this page) use fixed
          box sizes per screen width, not the source photo&rsquo;s own proportions, so pick photos that
          crop well to these:
        </p>
        <p className="mt-2 font-mono-tab">
          Hero — min-height: 520px (mobile) · 560px (≥640px) · 640px (≥1024px) · 720px (≥1536px, capped).
          Grows taller automatically if the heading/body text needs more room, never crops the text.
        </p>
        <p className="mt-1 font-mono-tab">
          Season spotlight photo — aspect ratio: 4:3 (mobile/tablet) · 3:2 (≥1024px).
        </p>
      </div>

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Hero image</h2>
        <div className="relative mt-3 aspect-[21/9] w-full max-w-xl overflow-hidden border border-stone-300 bg-ink">
          <Image
            src={hero.heroImageUrl}
            alt="Homepage hero image preview"
            fill
            sizes="(min-width: 1024px) 576px, 100vw"
            className="object-cover"
          />
        </div>
        <ImageUploadForm
          createUploadTarget={createHeroImageUploadUrlAction}
          finalizeUpload={finalizeHeroImageUploadAction}
          buttonLabel="Upload & replace"
        />
      </section>

      <section className="mt-10 max-w-xl">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Hero copy</h2>
        <form action={updateHomepageHeroAction} className="mt-3 space-y-5">
          <div className="border border-stone-300 bg-stone-100 p-4">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
              <input type="checkbox" name="announcementEnabled" defaultChecked={hero.announcementEnabled} className="h-4 w-4 accent-ink" />
              Announcement bar
            </label>
            <p className="mt-0.5 text-[11px] font-normal normal-case tracking-normal text-ink-soft/70">
              The bar above the hero on the homepage — e.g. a season or collection launch. Unchecked hides it.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_180px]">
              <Field label="Text">
                <input
                  type="text"
                  name="announcementText"
                  defaultValue={hero.announcementText}
                  placeholder="Summer 2027 Collection is Live Now"
                  className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink"
                />
              </Field>
              <Field label="Links to">
                <input
                  type="text"
                  name="announcementHref"
                  defaultValue={hero.announcementHref}
                  placeholder="/catalogue"
                  className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink"
                />
              </Field>
            </div>
            <Field label="Bar color">
              <select
                name="announcementColor"
                defaultValue={hero.announcementColor}
                className="w-full max-w-[180px] border border-stone-300 bg-white px-3 py-2 text-sm text-ink"
              >
                <option value="black">Black</option>
                <option value="burgundy">Burgundy</option>
              </select>
            </Field>
          </div>

          {/*
            English and Greek side by side. Greek fields are deliberately NOT `required`:
            an empty Greek hero is a valid, expected state (it falls back to English), and
            marking them required would block every save of the English copy until the
            Greek exists. The banner below is what keeps the gap visible instead.
          */}
          {!heroGreekComplete && (
            <p className="border border-signal bg-signal/10 px-3 py-2 text-xs font-semibold text-signal">
              The Greek hero is incomplete — {new URL(originForLocale("el")).host} falls back to
              the English text below until every Greek field is filled in.
            </p>
          )}

          <div className="grid grid-cols-1 gap-x-4 gap-y-4 lg:grid-cols-2">
            <Field label="Eyebrow — English">
              <input
                type="text"
                name="eyebrow"
                defaultValue={hero.eyebrow}
                required
                className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink"
              />
            </Field>
            <Field label="Eyebrow — Ελληνικά">
              <input
                type="text"
                name="eyebrowEl"
                defaultValue={hero.eyebrowEl}
                lang="el"
                placeholder="Δεν έχει συμπληρωθεί"
                className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink"
              />
            </Field>

            <Field label="Heading — English" hint="One line per row — each becomes a line break.">
              <textarea
                name="heading"
                defaultValue={hero.heading}
                required
                rows={3}
                className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink"
              />
            </Field>
            <Field label="Heading — Ελληνικά" hint="One line per row — each becomes a line break.">
              <textarea
                name="headingEl"
                defaultValue={hero.headingEl}
                lang="el"
                rows={3}
                placeholder="Δεν έχει συμπληρωθεί"
                className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink"
              />
            </Field>

            <Field label="Body — English">
              <textarea
                name="body"
                defaultValue={hero.body}
                required
                rows={3}
                className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink"
              />
            </Field>
            <Field label="Body — Ελληνικά">
              <textarea
                name="bodyEl"
                defaultValue={hero.bodyEl}
                lang="el"
                rows={3}
                placeholder="Δεν έχει συμπληρωθεί"
                className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink"
              />
            </Field>

            <Field label="Primary button label — English">
              <input
                type="text"
                name="primaryCtaLabel"
                defaultValue={hero.primaryCtaLabel}
                required
                className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink"
              />
            </Field>
            <Field label="Primary button label — Ελληνικά">
              <input
                type="text"
                name="primaryCtaLabelEl"
                defaultValue={hero.primaryCtaLabelEl}
                lang="el"
                placeholder="Δεν έχει συμπληρωθεί"
                className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink"
              />
            </Field>

            <Field label="Secondary button label — English">
              <input
                type="text"
                name="secondaryCtaLabel"
                defaultValue={hero.secondaryCtaLabel}
                required
                className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink"
              />
            </Field>
            <Field label="Secondary button label — Ελληνικά">
              <input
                type="text"
                name="secondaryCtaLabelEl"
                defaultValue={hero.secondaryCtaLabelEl}
                lang="el"
                placeholder="Δεν έχει συμπληρωθεί"
                className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink"
              />
            </Field>
          </div>

          {/* The two links are shared, not duplicated per language: they are routes, and
              each domain serves the same page at the same path. */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Primary button link" hint="Shared by both languages.">
              <input
                type="text"
                name="primaryCtaHref"
                defaultValue={hero.primaryCtaHref}
                required
                className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink"
              />
            </Field>
            <Field label="Secondary button link" hint="Shared by both languages.">
              <input
                type="text"
                name="secondaryCtaHref"
                defaultValue={hero.secondaryCtaHref}
                required
                className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink"
              />
            </Field>
          </div>

          <Field
            label="Production lead time (days)"
            hint="Shown to buyers as the estimated wait ('Made to order — ships in ~N days') for any order line that isn't fully covered by on-hand stock, for styles set to 'Made to order' on their Inventory tab. Styles set to 'Pre-order' there show no fixed ETA instead."
          >
            <input
              type="number"
              name="productionLeadTimeDays"
              defaultValue={hero.productionLeadTimeDays}
              min={1}
              required
              className="w-32 border border-stone-300 bg-white px-3 py-2 text-sm text-ink"
            />
          </Field>

          <Field
            label="WhatsApp order message — closing note"
            hint="The one free-text line in the automatic WhatsApp message sent to a buyer's phone when they request a proforma invoice — appended after the order figures (pairs, subtotal, VAT, total)."
          >
            {/* Whether WhatsApp is actually wired up is invisible from inside the app — the send
                path just logs a warning and no-ops — so an admin could edit this note for months
                without knowing no message ever goes out. Stating it here is the only place the
                deployment's real configuration is visible without shell access. */}
            {whatsappEnabled ? (
              <p className="mb-2 inline-block border border-positive/40 bg-positive-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-positive">
                WhatsApp connected — this note is being sent
              </p>
            ) : (
              <p className="mb-2 border border-court/50 bg-court-100 px-3 py-2 text-xs text-ink">
                <strong className="font-semibold uppercase tracking-wide">Not connected.</strong> No
                WhatsApp message is sent to anyone yet — buyers get their order confirmation by email
                only. This note is saved and will be used as soon as{" "}
                <code className="font-mono-tab">WHATSAPP_ACCESS_TOKEN</code>,{" "}
                <code className="font-mono-tab">WHATSAPP_PHONE_NUMBER_ID</code> and{" "}
                <code className="font-mono-tab">WHATSAPP_TEMPLATE_NAME</code> are set and Meta has
                approved the message template.
              </p>
            )}
            <textarea
              name="whatsappClosingNote"
              defaultValue={hero.whatsappClosingNote}
              rows={2}
              className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink"
            />
          </Field>

          <button
            type="submit"
            className="border border-ink bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85"
          >
            Save changes
          </button>
        </form>
      </section>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
      {hint && <span className="mt-0.5 block text-[11px] font-normal normal-case tracking-normal text-ink-soft/70">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
