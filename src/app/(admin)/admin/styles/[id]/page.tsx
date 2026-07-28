import Link from "next/link";
import { notFound } from "next/navigation";
import { getStyleById } from "@/lib/data/styles";
import { BOX_TYPES } from "@/lib/data/boxTypes";
import { listImagesForStyle } from "@/lib/data/styleImages";
import {
  createStyleImageUploadUrlAction,
  finalizeStyleImageUploadAction,
  setPrimaryImageAction,
  deleteStyleImageAction,
  updateAvailableBoxTypesAction,
} from "@/lib/adminActions";
import { ImageUploadForm } from "@/components/admin/ImageUploadForm";

export default async function AdminStyleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const style = await getStyleById(id);
  if (!style) notFound();

  const images = await listImagesForStyle(id);

  return (
    <div>
      <nav className="mb-4 text-xs text-ink-soft">
        <Link href="/admin/styles" className="hover:text-ink">Styles</Link> / {style.name}
      </nav>
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        {style.name}
      </h1>
      <p className="mt-1 font-mono-tab text-xs text-ink-soft">{style.styleNumber}</p>

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Box sizes offered</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Not every style ships in all three pre-packs — uncheck any this style doesn&rsquo;t offer.
        </p>
        <form action={updateAvailableBoxTypesAction} className="mt-3 flex flex-wrap items-center gap-5">
          <input type="hidden" name="styleId" value={style.id} />
          {BOX_TYPES.map((box) => (
            <label key={box.id} className="flex cursor-pointer items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                name={box.id}
                defaultChecked={style.availableBoxTypes.includes(box.id)}
                className="h-4 w-4 accent-ink"
              />
              {box.label}
            </label>
          ))}
          <button
            type="submit"
            className="border border-ink bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85"
          >
            Save
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Upload a photo</h2>
        <ImageUploadForm
          createUploadTarget={createStyleImageUploadUrlAction.bind(null, style.id)}
          finalizeUpload={finalizeStyleImageUploadAction.bind(null, style.id)}
          buttonLabel="Upload"
        />
      </section>

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Photos</h2>
        {images.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">No photos uploaded yet — the catalog shows a generated plate instead.</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((image) => (
              <div key={image.id} className="border border-stone-300 bg-white">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.publicUrl} alt={style.name} className="h-full w-full object-cover" />
                  {image.isPrimary && (
                    <span className="absolute left-2 top-2 bg-signal px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Primary
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 p-2.5">
                  {!image.isPrimary ? (
                    <form action={setPrimaryImageAction}>
                      <input type="hidden" name="styleId" value={style.id} />
                      <input type="hidden" name="imageId" value={image.id} />
                      <button type="submit" className="text-[11px] font-semibold uppercase tracking-wide text-signal hover:underline">
                        Set primary
                      </button>
                    </form>
                  ) : (
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">—</span>
                  )}
                  <form action={deleteStyleImageAction}>
                    <input type="hidden" name="styleId" value={style.id} />
                    <input type="hidden" name="imageId" value={image.id} />
                    <button type="submit" className="text-[11px] font-semibold uppercase tracking-wide text-ember hover:underline">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
