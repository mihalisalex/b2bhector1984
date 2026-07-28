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
      <TextField label="Weight (oz)" name="weightOz" type="number" step="0.01" defaultValue={style.weightOz} disabled={!canEdit} />

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">Product dimensions (cm)</p>
        <div className="grid grid-cols-3 gap-4">
          <TextField label="Length" name="lengthCm" type="number" step="0.1" defaultValue={style.lengthCm} disabled={!canEdit} />
          <TextField label="Width" name="widthCm" type="number" step="0.1" defaultValue={style.widthCm} disabled={!canEdit} />
          <TextField label="Height" name="heightCm" type="number" step="0.1" defaultValue={style.heightCm} disabled={!canEdit} />
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">Package (carton) dimensions (cm)</p>
        <div className="grid grid-cols-3 gap-4">
          <TextField label="Length" name="packageLengthCm" type="number" step="0.1" defaultValue={style.packageLengthCm} disabled={!canEdit} />
          <TextField label="Width" name="packageWidthCm" type="number" step="0.1" defaultValue={style.packageWidthCm} disabled={!canEdit} />
          <TextField label="Height" name="packageHeightCm" type="number" step="0.1" defaultValue={style.packageHeightCm} disabled={!canEdit} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Shipping class"
          name="shippingClass"
          defaultValue={style.shippingClass}
          disabled={!canEdit}
          options={[
            { value: "standard", label: "Standard" },
            { value: "oversized", label: "Oversized" },
            { value: "fragile", label: "Fragile" },
            { value: "freight_only", label: "Freight only" },
          ]}
        />
        <TextField label="Freight class" name="freightClass" defaultValue={style.freightClass} disabled={!canEdit} placeholder="e.g. NMFC 100" />
      </div>

      <CheckboxField label="Hazardous goods" name="hazardous" defaultChecked={style.hazardous} disabled={!canEdit} />

      {canEdit && <SaveBar isPending={isPending} />}
    </form>
  );
}
