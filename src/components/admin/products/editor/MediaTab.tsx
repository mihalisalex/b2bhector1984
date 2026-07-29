"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageUploadForm } from "@/components/admin/ImageUploadForm";
import {
  createProductImageUploadUrlAction,
  finalizeProductImageUploadAction,
  setPrimaryProductImageAction,
  updateImageAltTextAction,
  deleteProductImageAction,
  createDocumentUploadUrlAction,
  finalizeDocumentUploadAction,
  deleteDocumentAction,
} from "@/lib/productActions";
import type { Style } from "@/lib/types";
import type { StyleImage } from "@/lib/data/styleImages";

export function MediaTab({ style, images, canEdit }: { style: Style; images: StyleImage[]; canEdit: boolean }) {
  const videoAndSpins = style.documents.filter((d) => d.kind === "video" || d.kind === "image_360");

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Photos</h3>
        <p className="mt-1 text-xs text-ink-soft">
          Drag-and-drop isn&rsquo;t implemented — file picker uploads straight to storage via a signed URL (same
          pipeline as every upload in this app). Sizing/format optimization is handled by next/image at render time,
          not a separate transform pipeline.
        </p>
        {canEdit && (
          <ImageUploadForm
            createUploadTarget={createProductImageUploadUrlAction.bind(null, style.id)}
            finalizeUpload={finalizeProductImageUploadAction.bind(null, style.id)}
            buttonLabel="Upload photo"
          />
        )}
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {images.map((image, index) => (
            <ImageCard key={image.id} image={image} styleId={style.id} canEdit={canEdit} index={index} isFirst={index === 0} isLast={index === images.length - 1} />
          ))}
          {images.length === 0 && <p className="text-sm text-ink-soft">No photos uploaded yet — the catalog shows a generated plate instead.</p>}
        </div>
      </section>

      <section className="border-t border-stone-300 pt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Video & 360° images</h3>
        {canEdit && <VideoUploadForm styleId={style.id} />}
        <div className="mt-3 space-y-2">
          {videoAndSpins.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between gap-3 border border-stone-300 bg-white px-3 py-2 text-sm">
              <span className="text-ink-soft">{doc.kind === "video" ? "Video" : "360° set"} — </span>
              <a href={doc.publicUrl} target="_blank" rel="noreferrer" className="flex-1 truncate text-signal hover:underline">
                {doc.label || doc.storagePath.split("/").pop()}
              </a>
              {canEdit && (
                <form action={deleteDocumentAction}>
                  <input type="hidden" name="styleId" value={style.id} />
                  <input type="hidden" name="documentId" value={doc.id} />
                  <button type="submit" className="text-xs font-medium text-ember hover:underline">Remove</button>
                </form>
              )}
            </div>
          ))}
          {videoAndSpins.length === 0 && <p className="text-sm text-ink-soft">None uploaded yet.</p>}
        </div>
      </section>
    </div>
  );
}

function ImageCard({
  image,
  styleId,
  canEdit,
  index,
  isFirst,
  isLast,
}: {
  image: StyleImage;
  styleId: string;
  canEdit: boolean;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [alt, setAlt] = useState(image.altText);
  void isFirst;
  void isLast;

  return (
    <div className="border border-stone-300 bg-white">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-200">
        <Image src={image.publicUrl} alt={alt} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
        {image.isPrimary && (
          <span className="absolute left-2 top-2 bg-signal px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Featured</span>
        )}
      </div>
      <div className="space-y-2 p-2.5">
        <form action={updateImageAltTextAction} onBlur={(e) => e.currentTarget.requestSubmit()}>
          <input type="hidden" name="styleId" value={styleId} />
          <input type="hidden" name="imageId" value={image.id} />
          <input
            name="altText"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            disabled={!canEdit}
            placeholder="Alt text"
            aria-label={`Alt text for photo ${index + 1}`}
            className="w-full border border-stone-300 bg-white px-2 py-1 text-xs outline-none focus-visible:border-signal disabled:bg-stone-100"
          />
        </form>
        {canEdit && (
          <div className="flex items-center justify-between gap-2">
            {!image.isPrimary ? (
              <form action={setPrimaryProductImageAction}>
                <input type="hidden" name="styleId" value={styleId} />
                <input type="hidden" name="imageId" value={image.id} />
                <button type="submit" className="text-[11px] font-semibold uppercase tracking-wide text-signal hover:underline">
                  Set featured
                </button>
              </form>
            ) : (
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">—</span>
            )}
            <form action={deleteProductImageAction}>
              <input type="hidden" name="styleId" value={styleId} />
              <input type="hidden" name="imageId" value={image.id} />
              <button type="submit" className="text-[11px] font-semibold uppercase tracking-wide text-ember hover:underline">
                Delete
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function VideoUploadForm({ styleId }: { styleId: string }) {
  return (
    <ImageUploadForm
      accept="video/*,image/*"
      createUploadTarget={(fileName) => createDocumentUploadUrlAction(styleId, fileName)}
      finalizeUpload={(path) => finalizeDocumentUploadAction(styleId, path, path.match(/\.(mp4|mov|webm)$/i) ? "video" : "image_360", "")}
      buttonLabel="Upload video / 360° file"
    />
  );
}
