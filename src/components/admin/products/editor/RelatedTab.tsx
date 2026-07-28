"use client";

import { useState } from "react";
import { addStyleRelationAction, deleteStyleRelationAction } from "@/lib/productActions";
import type { RelationType, Style } from "@/lib/types";

const RELATION_LABEL: Record<RelationType, string> = {
  related: "Related product",
  cross_sell: "Cross-sell",
  upsell: "Upsell",
  frequently_bought: "Frequently bought together",
  accessory: "Accessory",
};

export function RelatedTab({ style, allStyles, canEdit }: { style: Style; allStyles: Style[]; canEdit: boolean }) {
  const [relatedStyleId, setRelatedStyleId] = useState(allStyles.find((s) => s.id !== style.id)?.id ?? "");
  const [relationType, setRelationType] = useState<RelationType>("related");
  const addAction = addStyleRelationAction.bind(null, style.id);
  const deleteAction = deleteStyleRelationAction.bind(null, style.id);

  const nameById = new Map(allStyles.map((s) => [s.id, s.name]));
  const byType = (Object.keys(RELATION_LABEL) as RelationType[]).map((type) => ({
    type,
    entries: style.relations.filter((r) => r.relationType === type),
  }));

  return (
    <div className="max-w-2xl space-y-6 pb-20">
      {byType.map(({ type, entries }) => (
        <div key={type}>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{RELATION_LABEL[type]}</h3>
          <div className="mt-2 space-y-1.5">
            {entries.map((r) => (
              <div key={r.id} className="flex items-center gap-3 border border-stone-300 bg-white px-3 py-1.5 text-sm">
                <span className="flex-1 text-ink">{nameById.get(r.relatedStyleId) ?? r.relatedStyleId}</span>
                {canEdit && (
                  <form action={deleteAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button type="submit" className="text-xs font-medium text-ember hover:underline">Remove</button>
                  </form>
                )}
              </div>
            ))}
            {entries.length === 0 && <p className="text-sm text-ink-soft">None set.</p>}
          </div>
        </div>
      ))}

      {canEdit && (
        <form action={addAction} className="flex items-end gap-3 border-t border-stone-300 pt-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Product</label>
            <select
              name="relatedStyleId"
              value={relatedStyleId}
              onChange={(e) => setRelatedStyleId(e.target.value)}
              className="border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal"
            >
              {allStyles.filter((s) => s.id !== style.id).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Relationship</label>
            <select
              name="relationType"
              value={relationType}
              onChange={(e) => setRelationType(e.target.value as RelationType)}
              className="border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal"
            >
              {(Object.keys(RELATION_LABEL) as RelationType[]).map((t) => (
                <option key={t} value={t}>{RELATION_LABEL[t]}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="border border-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink hover:bg-ink hover:text-white">
            Add
          </button>
        </form>
      )}
    </div>
  );
}
