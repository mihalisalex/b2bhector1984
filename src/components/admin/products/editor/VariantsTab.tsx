"use client";

import { useActionState, useEffect, useState } from "react";
import { addColorwayAction, updateColorwayAction, deleteColorwayAction } from "@/lib/productActions";
import { useToastResult } from "@/components/ui/ToastProvider";
import { formatEUR } from "@/lib/pricing";
import type { FormState } from "@/lib/actions";
import type { Colorway, Style } from "@/lib/types";

const initialState: FormState = {};

export function VariantsTab({ style, canEdit }: { style: Style; canEdit: boolean }) {
  return (
    <div className="max-w-4xl space-y-6 pb-20">
      <p className="text-xs text-ink-soft">
        This catalog&rsquo;s variant grain is colorway — box-only wholesale ordering (8/10/12-pair pre-packs) is a
        settled part of this domain, so there&rsquo;s no separate per-pair-size SKU. Each colorway below carries its
        own SKU/barcode plus optional price/cost/sale/weight/dimension overrides (blank = inherit the product&rsquo;s
        value). Stock per colorway × box type lives in the Inventory tab.
      </p>

      <div className="space-y-3">
        {style.colorways.map((colorway) => (
          <VariantRow key={colorway.id} styleId={style.id} colorway={colorway} canEdit={canEdit} />
        ))}
      </div>

      {canEdit && <AddVariantForm styleId={style.id} />}
    </div>
  );
}

function VariantRow({ styleId, colorway, canEdit }: { styleId: string; colorway: Colorway; canEdit: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteColorwayAction.bind(null, styleId, colorway.id), initialState);
  const showResult = useToastResult();

  useEffect(() => {
    if (deleteState.error) showResult(deleteState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteState]);

  return (
    <div className="border border-stone-300 bg-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="h-6 w-6 rounded-full border border-stone-300" style={{ background: `linear-gradient(135deg, ${colorway.swatch[0]}, ${colorway.swatch[1] ?? colorway.swatch[0]})` }} />
          <div>
            <p className="text-sm font-semibold text-ink">{colorway.name}</p>
            <p className="font-mono-tab text-[11px] text-ink-soft">
              {colorway.sku ?? colorway.skuSuffix}
              {colorway.priceOverride != null && ` · ${formatEUR(colorway.priceOverride)}`}
            </p>
          </div>
        </div>
        <button type="button" onClick={() => setExpanded((v) => !v)} className="text-xs font-semibold uppercase tracking-wide text-ink-soft hover:text-ink">
          {expanded ? "Collapse" : "Edit"}
        </button>
      </div>

      {expanded && (
        <form action={updateColorwayAction.bind(null, styleId, colorway.id)} className="space-y-3 border-t border-stone-300 bg-stone-50 px-4 py-4">
          <div className="grid grid-cols-3 gap-3">
            <Mini label="Name" name="name" defaultValue={colorway.name} disabled={!canEdit} />
            <Mini label="SKU suffix" name="skuSuffix" defaultValue={colorway.skuSuffix} disabled={!canEdit} />
            <Mini label="SKU" name="sku" defaultValue={colorway.sku} disabled={!canEdit} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Mini label="Barcode" name="barcode" defaultValue={colorway.barcode} disabled={!canEdit} />
            <Mini label="Swatch 1" name="swatch1" type="color" defaultValue={colorway.swatch[0]} disabled={!canEdit} />
            <Mini label="Swatch 2" name="swatch2" type="color" defaultValue={colorway.swatch[1] ?? colorway.swatch[0]} disabled={!canEdit} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Mini label="Price override" name="priceOverride" type="number" step="0.01" defaultValue={colorway.priceOverride} disabled={!canEdit} />
            <Mini label="Cost override" name="costOverride" type="number" step="0.01" defaultValue={colorway.costOverride} disabled={!canEdit} />
            <Mini label="Sale price override" name="salePriceOverride" type="number" step="0.01" defaultValue={colorway.salePriceOverride} disabled={!canEdit} />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Mini label="Weight (oz)" name="weightOz" type="number" step="0.01" defaultValue={colorway.weightOz} disabled={!canEdit} />
            <Mini label="Length (cm)" name="lengthCm" type="number" step="0.1" defaultValue={colorway.lengthCm} disabled={!canEdit} />
            <Mini label="Width (cm)" name="widthCm" type="number" step="0.1" defaultValue={colorway.widthCm} disabled={!canEdit} />
            <Mini label="Height (cm)" name="heightCm" type="number" step="0.1" defaultValue={colorway.heightCm} disabled={!canEdit} />
          </div>
          <div className="flex items-center justify-between">
            <select name="status" defaultValue={colorway.status ?? "active"} disabled={!canEdit} className="border border-stone-300 bg-white px-2 py-1.5 text-xs">
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            {canEdit && (
              <div className="flex items-center gap-3">
                <button type="submit" className="border border-ink bg-ink px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85">
                  Save variant
                </button>
                <button
                  type="button"
                  onClick={() => deleteAction(new FormData())}
                  disabled={isDeleting}
                  className="text-xs font-semibold uppercase tracking-wide text-ember hover:underline disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

function AddVariantForm({ styleId }: { styleId: string }) {
  const [state, formAction, isPending] = useActionState(addColorwayAction.bind(null, styleId), initialState);
  const showResult = useToastResult();
  useEffect(() => {
    if (state.error || state.success) showResult(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="space-y-3 border-t border-stone-300 pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Add variant</h3>
      <div className="grid grid-cols-3 gap-3">
        <Mini label="Name" name="name" required />
        <Mini label="SKU suffix" name="skuSuffix" />
        <Mini label="SKU" name="sku" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Mini label="Swatch 1" name="swatch1" type="color" defaultValue="#121212" />
        <Mini label="Swatch 2" name="swatch2" type="color" defaultValue="#6b6b6b" />
      </div>
      <button type="submit" disabled={isPending} className="border border-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink hover:bg-ink hover:text-white disabled:opacity-50">
        {isPending ? "Adding…" : "Add variant"}
      </button>
    </form>
  );
}

function Mini({
  label,
  name,
  defaultValue,
  type = "text",
  step,
  required,
  disabled,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  step?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
      <input
        name={name}
        type={type}
        step={step}
        required={required}
        disabled={disabled}
        defaultValue={defaultValue}
        className="w-full border border-stone-300 bg-white px-2 py-1.5 text-sm outline-none focus-visible:border-signal disabled:bg-stone-100"
      />
    </label>
  );
}
