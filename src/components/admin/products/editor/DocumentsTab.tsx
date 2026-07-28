"use client";

import { useState } from "react";
import { ImageUploadForm } from "@/components/admin/ImageUploadForm";
import { createDocumentUploadUrlAction, finalizeDocumentUploadAction, deleteDocumentAction } from "@/lib/productActions";
import type { DocumentKind, Style } from "@/lib/types";

const DOC_KINDS: { value: DocumentKind; label: string }[] = [
  { value: "manual", label: "Manual" },
  { value: "datasheet", label: "Datasheet" },
  { value: "certificate", label: "Certificate" },
  { value: "installation_guide", label: "Installation guide" },
  { value: "warranty", label: "Warranty document" },
  { value: "other", label: "Other" },
];

const DOC_LABEL: Record<DocumentKind, string> = {
  manual: "Manual",
  datasheet: "Datasheet",
  certificate: "Certificate",
  installation_guide: "Installation guide",
  warranty: "Warranty document",
  video: "Video",
  image_360: "360° set",
  other: "Other",
};

export function DocumentsTab({ style, canEdit }: { style: Style; canEdit: boolean }) {
  const [kind, setKind] = useState<DocumentKind>("manual");
  const [label, setLabel] = useState("");
  const documents = style.documents.filter((d) => d.kind !== "video" && d.kind !== "image_360");

  return (
    <div className="max-w-2xl space-y-6 pb-20">
      <p className="text-xs text-ink-soft">
        Manuals, datasheets, certificates, installation guides, and warranty documents — same signed-URL storage
        pipeline as every other upload in this app.
      </p>

      <div className="space-y-2">
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between gap-3 border border-stone-300 bg-white px-3 py-2 text-sm">
            <span className="w-36 shrink-0 text-xs font-semibold uppercase tracking-wide text-ink-soft">{DOC_LABEL[doc.kind]}</span>
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
        {documents.length === 0 && <p className="text-sm text-ink-soft">No documents uploaded yet.</p>}
      </div>

      {canEdit && (
        <div className="border-t border-stone-300 pt-4">
          <div className="mb-3 flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Document type</label>
              <select value={kind} onChange={(e) => setKind(e.target.value as DocumentKind)} className="border border-stone-300 bg-white px-3 py-2 text-sm">
                {DOC_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Label</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Care instructions" className="border border-stone-300 bg-white px-3 py-2 text-sm" />
            </div>
          </div>
          <ImageUploadForm
            accept="application/pdf,image/*"
            createUploadTarget={(fileName) => createDocumentUploadUrlAction(style.id, fileName)}
            finalizeUpload={(path) => finalizeDocumentUploadAction(style.id, path, kind, label)}
            buttonLabel="Upload document"
          />
        </div>
      )}
    </div>
  );
}
