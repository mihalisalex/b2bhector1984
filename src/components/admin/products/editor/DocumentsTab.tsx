"use client";

import { useActionState, useEffect, useState } from "react";
import { ImageUploadForm } from "@/components/admin/ImageUploadForm";
import { useToastResult } from "@/components/ui/ToastProvider";
import { createDocumentUploadUrlAction, finalizeDocumentUploadAction, deleteDocumentAction } from "@/lib/productActions";
import type { FormState } from "@/lib/actions";
import type { DocumentKind, Style } from "@/lib/types";

const initialState: FormState = {};

const DOC_KINDS: { value: DocumentKind; label: string }[] = [
  { value: "manual", label: "Εγχειρίδιο" },
  { value: "datasheet", label: "Τεχνικό φύλλο" },
  { value: "certificate", label: "Πιστοποιητικό" },
  { value: "installation_guide", label: "Οδηγός" },
  { value: "warranty", label: "Εγγύηση" },
  { value: "other", label: "Άλλο" },
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
        Εγχειρίδια, τεχνικά φύλλα, πιστοποιητικά και εγγυήσεις.
      </p>

      <div className="space-y-2">
        {documents.map((doc) => (
          <DocumentRow key={doc.id} styleId={style.id} documentId={doc.id} kindLabel={DOC_LABEL[doc.kind]} label={doc.label || doc.storagePath.split("/").pop() || ""} publicUrl={doc.publicUrl} canEdit={canEdit} />
        ))}
        {documents.length === 0 && <p className="text-sm text-ink-soft">Κανένα έγγραφο ακόμα.</p>}
      </div>

      {canEdit && (
        <div className="border-t border-stone-300 pt-4">
          <div className="mb-3 flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Τύπος εγγράφου</label>
              <select value={kind} onChange={(e) => setKind(e.target.value as DocumentKind)} className="border border-stone-300 bg-white px-3 py-2 text-sm">
                {DOC_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Ονομασία</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="π.χ. Οδηγίες φροντίδας" className="border border-stone-300 bg-white px-3 py-2 text-sm" />
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

function DocumentRow({
  styleId,
  documentId,
  kindLabel,
  label,
  publicUrl,
  canEdit,
}: {
  styleId: string;
  documentId: string;
  kindLabel: string;
  label: string;
  publicUrl: string;
  canEdit: boolean;
}) {
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteDocumentAction, initialState);
  const showResult = useToastResult();

  useEffect(() => {
    if (deleteState.error) showResult(deleteState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteState]);

  return (
    <div className="flex items-center justify-between gap-3 border border-stone-300 bg-white px-3 py-2 text-sm">
      <span className="w-36 shrink-0 text-xs font-semibold uppercase tracking-wide text-ink-soft">{kindLabel}</span>
      <a href={publicUrl} target="_blank" rel="noreferrer" className="flex-1 truncate text-signal hover:underline">
        {label}
      </a>
      {canEdit && (
        <form action={deleteAction}>
          <input type="hidden" name="styleId" value={styleId} />
          <input type="hidden" name="documentId" value={documentId} />
          <button type="submit" disabled={isDeleting} className="text-xs font-medium text-ember hover:underline disabled:opacity-50">Αφαίρεση</button>
        </form>
      )}
    </div>
  );
}
