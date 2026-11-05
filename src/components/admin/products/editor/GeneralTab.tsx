"use client";

import { useActionState, useEffect } from "react";
import { updateGeneralAction } from "@/lib/productActions";
import { useToastResult } from "@/components/ui/ToastProvider";
import { TextField, TextAreaField, SelectField, SaveBar } from "@/components/admin/products/editor/FormField";
import { RichTextEditor } from "@/components/admin/products/editor/RichTextEditor";
import { CATEGORY_LABEL, SEASON_LABEL, GENDER_LABEL } from "@/lib/data/styleLabels";
import type { FormState } from "@/lib/actions";
import type { Brand, Collection, Style, Supplier } from "@/lib/types";

const initialState: FormState = {};

export function GeneralTab({
  style,
  brands,
  suppliers,
  collections,
  canEdit,
}: {
  style: Style;
  brands: Brand[];
  suppliers: Supplier[];
  collections: Collection[];
  canEdit: boolean;
}) {
  const action = updateGeneralAction.bind(null, style.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const showResult = useToastResult();

  useEffect(() => {
    if (state.error || state.success) showResult(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="max-w-3xl space-y-5 pb-20">
      {!canEdit && <p className="border border-stone-300 bg-stone-100 px-4 py-2 text-sm text-ink-soft">Ο ρόλος σου επιτρέπει μόνο προβολή.</p>}

      <div className="grid grid-cols-2 gap-4">
        <TextField label="Όνομα προϊόντος" name="name" defaultValue={style.name} required disabled={!canEdit} />
        <TextField label="Κωδικός" name="styleNumber" defaultValue={style.styleNumber} required disabled={!canEdit} />
      </div>

      <TextField label="Τύπος προϊόντος" name="productType" defaultValue={style.productType} disabled={!canEdit} />

      <TextField label="Σύντομη περιγραφή" name="tagline" defaultValue={style.tagline} disabled={!canEdit} />

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Πλήρης περιγραφή</label>
        <RichTextEditor name="description" label="Πλήρης περιγραφή" defaultValue={style.description} disabled={!canEdit} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SelectField
          label="Κατηγορία"
          name="category"
          defaultValue={style.category}
          disabled={!canEdit}
          options={Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label }))}
        />
        <SelectField
          label="Σεζόν"
          name="season"
          defaultValue={style.season}
          disabled={!canEdit}
          options={Object.entries(SEASON_LABEL).map(([value, label]) => ({ value, label }))}
        />
        <SelectField
          label="Φύλο"
          name="gender"
          defaultValue={style.gender}
          disabled={!canEdit}
          options={Object.entries(GENDER_LABEL).map(([value, label]) => ({ value, label }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Μάρκα" name="brandId" defaultValue={style.brandId} disabled={!canEdit} options={brands.map((b) => ({ value: b.id, label: b.name }))} />
        <SelectField
          label="Προμηθευτής"
          name="supplierId"
          defaultValue={style.supplierId ?? ""}
          disabled={!canEdit}
          options={[{ value: "", label: "— Κανένας —" }, ...suppliers.map((s) => ({ value: s.id, label: s.name }))]}
        />
      </div>

      <TextAreaField label="Υλικά (με κόμμα)" name="materials" defaultValue={style.materials.join(", ")} rows={2} disabled={!canEdit} />
      <TextField label="Ετικέτες (με κόμμα)" name="tags" defaultValue={style.tags.join(", ")} disabled={!canEdit} />

      <div>
        <TextField
          label="Ημερομηνία καταλόγου"
          name="createdAt"
          type="datetime-local"
          defaultValue={toDateTimeInput(style.createdAt)}
          disabled={!canEdit}
        />
        <p className="mt-1 text-xs text-ink-soft">
          Sets this product&rsquo;s place in the catalogue, which is ordered newest first by default — a later date
          moves it further forward. Also shown as &ldquo;Created&rdquo; in the products table. Times are UTC.
        </p>
      </div>

      {collections.length > 0 && (
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Συλλογές</label>
          <div className="flex flex-wrap gap-3">
            {collections.map((c) => (
              <label key={c.id} className="flex items-center gap-1.5 text-sm text-ink">
                <input type="checkbox" name="collectionIds" value={c.id} defaultChecked={style.collectionIds.includes(c.id)} disabled={!canEdit} className="h-4 w-4 accent-ink" />
                {c.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {canEdit && <SaveBar isPending={isPending} />}
    </form>
  );
}

/**
 * ISO timestamp -> the "YYYY-MM-DDTHH:mm" that `datetime-local` expects.
 *
 * Sliced rather than run through `toLocaleString`, so the server render and the browser
 * render produce byte-identical output. Formatting as local time here would differ
 * between a UTC host and the admin's own timezone and hydrate mismatched. The value
 * stays UTC end to end — `parseCreatedAt` reads it back the same way.
 */
function toDateTimeInput(iso: string): string {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(iso) ? iso.slice(0, 16) : "";
}
