"use client";

import { useActionState, useEffect } from "react";
import { addStyleAttributeAction, deleteStyleAttributeAction } from "@/lib/productActions";
import { useToastResult } from "@/components/ui/ToastProvider";
import type { FormState } from "@/lib/actions";
import type { Style } from "@/lib/types";

const SUGGESTIONS = ["Material", "Finish", "Country of Origin", "Warranty", "Compatibility", "Voltage", "Power", "Capacity"];
const initialState: FormState = {};

export function AttributesTab({ style, canEdit }: { style: Style; canEdit: boolean }) {
  const [addState, addAction, isAdding] = useActionState(addStyleAttributeAction.bind(null, style.id), initialState);
  const showResult = useToastResult();

  useEffect(() => {
    if (addState.error || addState.success) showResult(addState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addState]);

  return (
    <div className="max-w-2xl space-y-6 pb-20">
      <p className="text-xs text-ink-soft">Unlimited custom key/value attributes — Material, Finish, Country of Origin, Warranty, and anything else specific to this product.</p>

      <div className="space-y-2">
        {style.attributes.map((attr) => (
          <AttributeRow key={attr.id} styleId={style.id} attributeId={attr.id} attrKey={attr.key} attrValue={attr.value} canEdit={canEdit} />
        ))}
        {style.attributes.length === 0 && <p className="text-sm text-ink-soft">No custom attributes yet.</p>}
      </div>

      {canEdit && (
        <form action={addAction} className="flex items-end gap-3 border-t border-stone-300 pt-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Attribute</label>
            <input name="key" list="attribute-suggestions" required className="border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal" />
            <datalist id="attribute-suggestions">
              {SUGGESTIONS.map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Value</label>
            <input name="value" required className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal" />
          </div>
          <button type="submit" disabled={isAdding} className="border border-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink hover:bg-ink hover:text-white disabled:opacity-50">
            {isAdding ? "Adding…" : "Add"}
          </button>
        </form>
      )}
    </div>
  );
}

function AttributeRow({
  styleId,
  attributeId,
  attrKey,
  attrValue,
  canEdit,
}: {
  styleId: string;
  attributeId: string;
  attrKey: string;
  attrValue: string;
  canEdit: boolean;
}) {
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteStyleAttributeAction.bind(null, styleId), initialState);
  const showResult = useToastResult();

  useEffect(() => {
    if (deleteState.error) showResult(deleteState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteState]);

  return (
    <div className="flex items-center gap-3 border border-stone-300 bg-white px-3 py-2 text-sm">
      <span className="w-40 shrink-0 font-semibold text-ink">{attrKey}</span>
      <span className="flex-1 text-ink-soft">{attrValue}</span>
      {canEdit && (
        <form action={deleteAction}>
          <input type="hidden" name="id" value={attributeId} />
          <button type="submit" disabled={isDeleting} className="text-xs font-medium text-ember hover:underline disabled:opacity-50">Remove</button>
        </form>
      )}
    </div>
  );
}
