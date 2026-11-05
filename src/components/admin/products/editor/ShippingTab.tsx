"use client";

import { useActionState, useEffect } from "react";
import { updateShippingAction } from "@/lib/productActions";
import { useToastResult } from "@/components/ui/ToastProvider";
import { TextField, SelectField, CheckboxField, SaveBar } from "@/components/admin/products/editor/FormField";
import type { FormState } from "@/lib/actions";
import type { Style } from "@/lib/types";

const initialState: FormState = {};

export function ShippingTab({ style, canEdit }: { style: Style; canEdit: boolean }) {
  const action = updateShippingAction.bind(null, style.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const showResult = useToastResult();
  useEffect(() => {
    if (state.error || state.success) showResult(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="max-w-2xl space-y-5 pb-20">
      {/* Grams per pair, shown on the product page as "About 1 kg per pair". Leave empty to
          hide the weight line. */}
      <TextField label="Βάρος ζεύγους (γραμμάρια)" name="weightG" type="number" step="10" defaultValue={style.weightG} disabled={!canEdit} />

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">Διαστάσεις προϊόντος (cm)</p>
        <div className="grid grid-cols-3 gap-4">
          <TextField label="Μήκος" name="lengthCm" type="number" step="0.1" defaultValue={style.lengthCm} disabled={!canEdit} />
          <TextField label="Πλάτος" name="widthCm" type="number" step="0.1" defaultValue={style.widthCm} disabled={!canEdit} />
          <TextField label="Ύψος" name="heightCm" type="number" step="0.1" defaultValue={style.heightCm} disabled={!canEdit} />
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">Διαστάσεις κιβωτίου (cm)</p>
        <div className="grid grid-cols-3 gap-4">
          <TextField label="Μήκος" name="packageLengthCm" type="number" step="0.1" defaultValue={style.packageLengthCm} disabled={!canEdit} />
          <TextField label="Πλάτος" name="packageWidthCm" type="number" step="0.1" defaultValue={style.packageWidthCm} disabled={!canEdit} />
          <TextField label="Ύψος" name="packageHeightCm" type="number" step="0.1" defaultValue={style.packageHeightCm} disabled={!canEdit} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Κατηγορία αποστολής"
          name="shippingClass"
          defaultValue={style.shippingClass}
          disabled={!canEdit}
          options={[
            { value: "standard", label: "Κανονικό" },
            { value: "oversized", label: "Μεγάλου όγκου" },
            { value: "fragile", label: "Εύθραυστο" },
            { value: "freight_only", label: "Μόνο φορτίο" },
          ]}
        />
        <TextField label="Κατηγορία φορτίου" name="freightClass" defaultValue={style.freightClass} disabled={!canEdit} placeholder="e.g. NMFC 100" />
      </div>

      <CheckboxField label="Επικίνδυνα εμπορεύματα" name="hazardous" defaultChecked={style.hazardous} disabled={!canEdit} />

      {canEdit && <SaveBar isPending={isPending} />}
    </form>
  );
}
