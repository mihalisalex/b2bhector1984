"use client";

import { addStyleAttributeAction, deleteStyleAttributeAction } from "@/lib/productActions";
import type { Style } from "@/lib/types";

const SUGGESTIONS = ["Material", "Finish", "Country of Origin", "Warranty", "Compatibility", "Voltage", "Power", "Capacity"];

export function AttributesTab({ style, canEdit }: { style: Style; canEdit: boolean }) {
  const addAction = addStyleAttributeAction.bind(null, style.id);
  const deleteAction = deleteStyleAttributeAction.bind(null, style.id);

  return (
    <div className="max-w-2xl space-y-6 pb-20">
      <p className="text-xs text-ink-soft">Unlimited custom key/value attributes — Material, Finish, Country of Origin, Warranty, and anything else specific to this product.</p>

      <div className="space-y-2">
        {style.attributes.map((attr) => (
          <div key={attr.id} className="flex items-center gap-3 border border-stone-300 bg-white px-3 py-2 text-sm">
            <span className="w-40 shrink-0 font-semibold text-ink">{attr.key}</span>
            <span className="flex-1 text-ink-soft">{attr.value}</span>
            {canEdit && (
              <form action={deleteAction}>
                <input type="hidden" name="id" value={attr.id} />
                <button type="submit" className="text-xs font-medium text-ember hover:underline">Remove</button>
              </form>
            )}
          </div>
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
          <button type="submit" className="border border-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink hover:bg-ink hover:text-white">
            Add
          </button>
        </form>
      )}
    </div>
  );
}
