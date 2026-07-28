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

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Hero image</h2>
        <div className="relative mt-3 aspect-[21/9] w-full max-w-xl overflow-hidden border border-stone-300 bg-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero.heroImageUrl} alt="" className="h-full w-full object-cover grayscale" />
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
