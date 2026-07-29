"use client";

import { useActionState, useEffect, useState } from "react";
import { addStyleRelationAction, deleteStyleRelationAction } from "@/lib/productActions";
import { useToastResult } from "@/components/ui/ToastProvider";
import type { FormState } from "@/lib/actions";
import type { RelationType, Style } from "@/lib/types";

const initialState: FormState = {};

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
  const [addState, addAction, isAdding] = useActionState(addStyleRelationAction.bind(null, style.id), initialState);
  const showResult = useToastResult();

  useEffect(() => {
    if (addState.error || addState.success) showResult(addState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addState]);

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
              <RelationRow key={r.id} styleId={style.id} relationId={r.id} name={nameById.get(r.relatedStyleId) ?? r.relatedStyleId} canEdit={canEdit} />
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
          <button type="submit" disabled={isAdding} className="border border-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink hover:bg-ink hover:text-white disabled:opacity-50">
            {isAdding ? "Adding…" : "Add"}
          </button>
        </form>
      )}
    </div>
  );
}

function RelationRow({ styleId, relationId, name, canEdit }: { styleId: string; relationId: string; name: string; canEdit: boolean }) {
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteStyleRelationAction.bind(null, styleId), initialState);
  const showResult = useToastResult();

  useEffect(() => {
    if (deleteState.error) showResult(deleteState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteState]);

  return (
    <div className="flex items-center gap-3 border border-stone-300 bg-white px-3 py-1.5 text-sm">
      <span className="flex-1 text-ink">{name}</span>
      {canEdit && (
        <form action={deleteAction}>
          <input type="hidden" name="id" value={relationId} />
          <button type="submit" disabled={isDeleting} className="text-xs font-medium text-ember hover:underline disabled:opacity-50">Remove</button>
        </form>
      )}
    </div>
  );
}
