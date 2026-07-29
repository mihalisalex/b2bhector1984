"use client";

import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import { ImageUploadForm } from "@/components/admin/ImageUploadForm";
import { useToastResult } from "@/components/ui/ToastProvider";
import {
  createProductImageUploadUrlAction,
  finalizeProductImageUploadAction,
  setPrimaryProductImageAction,
  updateImageAltTextAction,
  updateImageColorwayAction,
  deleteProductImageAction,
  createDocumentUploadUrlAction,
  finalizeDocumentUploadAction,
  deleteDocumentAction,
} from "@/lib/productActions";
import type { FormState } from "@/lib/actions";
import type { Colorway, Style } from "@/lib/types";
import type { StyleImage } from "@/lib/data/styleImages";

const initialState: FormState = {};

export function MediaTab({ style, images, canEdit }: { style: Style; images: StyleImage[]; canEdit: boolean }) {
  const videoAndSpins = style.documents.filter((d) => d.kind === "video" || d.kind === "image_360");
  const showResult = useToastResult();

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Photos</h3>
        <p className="mt-1 text-xs text-ink-soft">
          Drag-and-drop isn&rsquo;t implemented — file picker uploads straight to storage via a signed URL (same
          pipeline as every upload in this app). Sizing/format optimization is handled by next/image at render time,
          not a separate transform pipeline. Tag a photo to a colorway below so it&rsquo;s the one shown when a buyer
          selects that colorway on the product page — leave it &ldquo;All colorways&rdquo; for a generic shot.
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
            <ImageCard key={image.id} image={image} styleId={style.id} colorways={style.colorways} canEdit={canEdit} index={index} isFirst={index === 0} isLast={index === images.length - 1} />
          ))}
          {images.length === 0 && <p className="text-sm text-ink-soft">No photos uploaded yet — the catalog shows a generated plate instead.</p>}
        </div>
      </section>

      <section className="border-t border-stone-300 pt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Video & 360° images</h3>
        {canEdit && <VideoUploadForm styleId={style.id} />}
        <div className="mt-3 space-y-2">
          {videoAndSpins.map((doc) => (
            <DocumentRow key={doc.id} styleId={style.id} documentId={doc.id} label={doc.label || doc.storagePath.split("/").pop() || ""} publicUrl={doc.publicUrl} prefix={doc.kind === "video" ? "Video" : "360° set"} canEdit={canEdit} showResult={showResult} />
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
  colorways,
  canEdit,
  index,
  isFirst,
  isLast,
}: {
  image: StyleImage;
  styleId: string;
  colorways: Colorway[];
  canEdit: boolean;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [alt, setAlt] = useState(image.altText);
  void isFirst;
  void isLast;
  const showResult = useToastResult();

  const [altState, altAction] = useActionState(updateImageAltTextAction, initialState);
  const [colorwayState, colorwayAction] = useActionState(updateImageColorwayAction, initialState);
  const [primaryState, primaryAction, isSettingPrimary] = useActionState(setPrimaryProductImageAction, initialState);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteProductImageAction, initialState);

  useEffect(() => {
    if (altState.error) showResult(altState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [altState]);
  useEffect(() => {
    if (colorwayState.error) showResult(colorwayState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorwayState]);
  useEffect(() => {
    if (primaryState.error) showResult(primaryState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryState]);
  useEffect(() => {
    if (deleteState.error) showResult(deleteState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteState]);

  return (
    <div className="border border-stone-300 bg-white">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-200">
        <Image src={image.publicUrl} alt={alt} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
        {image.isPrimary && (
          <span className="absolute left-2 top-2 bg-signal px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Featured</span>
        )}
      </div>
      <div className="space-y-2 p-2.5">
        <form action={altAction} onBlur={(e) => e.currentTarget.requestSubmit()}>
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
        {colorways.length > 1 && (
          <form action={colorwayAction}>
            <input type="hidden" name="styleId" value={styleId} />
            <input type="hidden" name="imageId" value={image.id} />
            <select
              name="colorwayId"
              defaultValue={image.colorwayId ?? ""}
              disabled={!canEdit}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              aria-label={`Colorway shown in photo ${index + 1}`}
              className="w-full border border-stone-300 bg-white px-2 py-1 text-xs outline-none focus-visible:border-signal disabled:bg-stone-100"
            >
              <option value="">All colorways</option>
              {colorways.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </form>
        )}
        {canEdit && (
          <div className="flex items-center justify-between gap-2">
            {!image.isPrimary ? (
              <form action={primaryAction}>
                <input type="hidden" name="styleId" value={styleId} />
                <input type="hidden" name="imageId" value={image.id} />
                <button type="submit" disabled={isSettingPrimary} className="text-[11px] font-semibold uppercase tracking-wide text-signal hover:underline disabled:opacity-50">
                  Set featured
                </button>
              </form>
            ) : (
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">—</span>
            )}
            <form action={deleteAction}>
              <input type="hidden" name="styleId" value={styleId} />
              <input type="hidden" name="imageId" value={image.id} />
              <button type="submit" disabled={isDeleting} className="text-[11px] font-semibold uppercase tracking-wide text-ember hover:underline disabled:opacity-50">
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

function DocumentRow({
  styleId,
  documentId,
  label,
  publicUrl,
  prefix,
  canEdit,
  showResult,
}: {
  styleId: string;
  documentId: string;
  label: string;
  publicUrl: string;
  prefix: string;
  canEdit: boolean;
  showResult: (result: FormState | null | undefined) => void;
}) {
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteDocumentAction, initialState);

  useEffect(() => {
    if (deleteState.error) showResult(deleteState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteState]);

  return (
    <div className="flex items-center justify-between gap-3 border border-stone-300 bg-white px-3 py-2 text-sm">
      <span className="text-ink-soft">{prefix} — </span>
      <a href={publicUrl} target="_blank" rel="noreferrer" className="flex-1 truncate text-signal hover:underline">
        {label}
      </a>
      {canEdit && (
        <form action={deleteAction}>
          <input type="hidden" name="styleId" value={styleId} />
          <input type="hidden" name="documentId" value={documentId} />
          <button type="submit" disabled={isDeleting} className="text-xs font-medium text-ember hover:underline disabled:opacity-50">Remove</button>
        </form>
      )}
    </div>
  );
}
