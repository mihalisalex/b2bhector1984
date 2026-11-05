"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { updatePricingAction, addCustomerGroupPriceAction, deleteCustomerGroupPriceAction } from "@/lib/productActions";
import { useToastResult } from "@/components/ui/ToastProvider";
import { TextField, SelectField, SaveBar } from "@/components/admin/products/editor/FormField";
import { formatEUR } from "@/lib/pricing";
import type { FormState } from "@/lib/actions";
import type { Style } from "@/lib/types";

const initialState: FormState = {};

function toLocalInput(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 16);
}

export function PricingTab({ style, canEdit }: { style: Style; canEdit: boolean }) {
  const action = updatePricingAction.bind(null, style.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const showResult = useToastResult();

  const [cost, setCost] = useState(style.costPrice);
  const [base, setBase] = useState(style.basePrice);

  useEffect(() => {
    if (state.error || state.success) showResult(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const margin = useMemo(() => {
    if (base <= 0) return 0;
    return Math.round(((base - cost) / base) * 1000) / 10;
  }, [base, cost]);

  return (
    <form action={formAction} className="max-w-3xl space-y-5 pb-20">
      {!canEdit && <p className="border border-stone-300 bg-stone-100 px-4 py-2 text-sm text-ink-soft">Ο ρόλος σου δεν αλλάζει τιμές.</p>}

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="costPrice" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Κόστος</label>
          <input
            id="costPrice"
            name="costPrice"
            type="number"
            step="0.01"
            value={cost}
            onChange={(e) => setCost(Number(e.target.value) || 0)}
            disabled={!canEdit}
            className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal disabled:bg-stone-100"
          />
        </div>
        <div>
          <label htmlFor="basePrice" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Χονδρική (τιμή καταλόγου)</label>
          <input
            id="basePrice"
            name="basePrice"
            type="number"
            step="0.01"
            required
            value={base}
            onChange={(e) => setBase(Number(e.target.value) || 0)}
            disabled={!canEdit}
            className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal disabled:bg-stone-100"
          />
        </div>
        <TextField label="Προτεινόμενη λιανική" name="msrp" type="number" step="0.01" defaultValue={style.msrp} disabled={!canEdit} />
      </div>
      <div className="border border-stone-300 bg-stone-100 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Περιθώριο κέρδους</p>
        <p className="font-mono-tab mt-1 text-lg text-ink">{margin}%</p>
        <p className="text-xs text-ink-soft">(Χονδρική − Κόστος) ÷ Χονδρική, υπολογίζεται καθώς γράφεις.</p>
      </div>

      <TextField label="Τιμή διανομέα" name="distributorPrice" type="number" step="0.01" defaultValue={style.distributorPrice} disabled={!canEdit} />

      <div className="grid grid-cols-3 gap-4">
        <TextField label="Τιμή έκπτωσης" name="salePrice" type="number" step="0.01" defaultValue={style.salePrice} disabled={!canEdit} />
        <TextField label="Έναρξη έκπτωσης" name="saleStartAt" type="datetime-local" defaultValue={toLocalInput(style.saleStartAt)} disabled={!canEdit} />
        <TextField label="Λήξη έκπτωσης" name="saleEndAt" type="datetime-local" defaultValue={toLocalInput(style.saleEndAt)} disabled={!canEdit} />
      </div>
      <p className="text-xs text-ink-soft">
        A scheduled sale price actually overrides the wholesale list price sitewide while active — see the catalog/cart
        pricing engine. Leave both dates blank for an always-on sale price.
      </p>

      <div className="grid grid-cols-3 gap-4">
        <SelectField label="Νόμισμα" name="currency" defaultValue={style.currency} disabled={!canEdit} options={[{ value: "EUR", label: "EUR" }, { value: "USD", label: "USD" }, { value: "GBP", label: "GBP" }]} />
        <SelectField label="Φορολογική κατηγορία" name="taxClass" defaultValue={style.taxClass} disabled={!canEdit} options={[{ value: "standard", label: "Κανονικό" }, { value: "reduced", label: "Μειωμένο" }, { value: "zero", label: "Μηδενικό" }]} />
        <TextField label="Συντελεστής ΦΠΑ" name="vatRate" type="number" step="0.01" defaultValue={style.vatRate} disabled={!canEdit} />
      </div>

      {canEdit && <SaveBar isPending={isPending} />}

      <CustomerGroupPricing style={style} canEdit={canEdit} />
    </form>
  );
}

function CustomerGroupPricing({ style, canEdit }: { style: Style; canEdit: boolean }) {
  const [addState, addAction, isAdding] = useActionState(addCustomerGroupPriceAction.bind(null, style.id), initialState);
  const showResult = useToastResult();

  useEffect(() => {
    if (addState.error || addState.success) showResult(addState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addState]);

  return (
    <div className="border-t border-stone-300 pt-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Τιμές ανά ομάδα πελατών</h3>
      <p className="mt-1 text-xs text-ink-soft">
        Μόνο για σημείωση: δεν επηρεάζουν τις τιμές στο ταμείο.
      </p>
      <div className="mt-3 space-y-2">
        {style.customerGroupPrices.map((g) => (
          <GroupPriceRow key={g.id} styleId={style.id} groupPriceId={g.id} groupName={g.groupName} price={g.price} canEdit={canEdit} />
        ))}
        {style.customerGroupPrices.length === 0 && <p className="text-sm text-ink-soft">Καμία ειδική τιμή ακόμα.</p>}
      </div>
      {canEdit && (
        <form action={addAction} className="mt-3 flex items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Όνομα ομάδας</label>
            <input name="groupName" required className="border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Τιμή</label>
            <input name="price" type="number" step="0.01" required className="w-28 border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal" />
          </div>
          <button type="submit" disabled={isAdding} className="border border-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink hover:bg-ink hover:text-white disabled:opacity-50">
            {isAdding ? "Adding…" : "Add"}
          </button>
        </form>
      )}
    </div>
  );
}

function GroupPriceRow({
  styleId,
  groupPriceId,
  groupName,
  price,
  canEdit,
}: {
  styleId: string;
  groupPriceId: string;
  groupName: string;
  price: number;
  canEdit: boolean;
}) {
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteCustomerGroupPriceAction.bind(null, styleId), initialState);
  const showResult = useToastResult();

  useEffect(() => {
    if (deleteState.error) showResult(deleteState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteState]);

  return (
    <div className="flex items-center gap-3 border border-stone-300 bg-white px-3 py-2 text-sm">
      <span className="flex-1 text-ink">{groupName}</span>
      <span className="tabular-nums text-ink">{formatEUR(price)}</span>
      {canEdit && (
        <form action={deleteAction}>
          <input type="hidden" name="id" value={groupPriceId} />
          <button type="submit" disabled={isDeleting} className="text-xs font-medium text-ember hover:underline disabled:opacity-50">Αφαίρεση</button>
        </form>
      )}
    </div>
  );
}
