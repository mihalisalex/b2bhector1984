import Image from "next/image";
import { getHomepageHero } from "@/lib/data/siteContent";
import {
  updateHomepageHeroAction,
  createHeroImageUploadUrlAction,
  finalizeHeroImageUploadAction,
} from "@/lib/adminActions";
import { ImageUploadForm } from "@/components/admin/ImageUploadForm";

export default async function AdminContentPage() {
  const hero = await getHomepageHero();

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
          </div>

          <Field label="Eyebrow">
            <input
              type="text"
              name="eyebrow"
              defaultValue={hero.eyebrow}
              required
              className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink"
            />
          </Field>

          <Field label="Heading" hint="One line per row — each becomes a line break.">
            <textarea
              name="heading"
              defaultValue={hero.heading}
              required
              rows={3}
              className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink"
            />
          </Field>

          <Field label="Body">
            <textarea
              name="body"
              defaultValue={hero.body}
              required
              rows={3}
              className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Primary button label">
              <input
                type="text"
                name="primaryCtaLabel"
                defaultValue={hero.primaryCtaLabel}
                required
                className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink"
              />
            </Field>
            <Field label="Primary button link">
              <input
                type="text"
                name="primaryCtaHref"
                defaultValue={hero.primaryCtaHref}
                required
                className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink"
              />
            </Field>
            <Field label="Secondary button label">
              <input
                type="text"
                name="secondaryCtaLabel"
                defaultValue={hero.secondaryCtaLabel}
                required
                className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink"
              />
            </Field>
            <Field label="Secondary button link">
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
            hint="Shown to buyers as the estimated wait ('Production upon request — ships in ~N days') for any order line that isn't fully covered by on-hand stock."
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
