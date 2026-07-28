"use client";

import { useActionState, useState } from "react";
import {
  addShipToAddress,
  updateShipToAddress,
  deleteShipToAddress,
  setDefaultShipToAddress,
  type FormState,
} from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import type { ShipToAddress } from "@/lib/types";

const initialState: FormState = {};

export function ShipToManager({ addresses }: { addresses: ShipToAddress[] }) {
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {addresses.map((address) =>
        editingId === address.id ? (
          <AddressForm key={address.id} mode="edit" address={address} onDone={() => setEditingId(null)} />
        ) : (
          <AddressCard
            key={address.id}
            address={address}
            canDelete={addresses.length > 1}
            onEdit={() => setEditingId(address.id)}
          />
        ),
      )}

      {addingNew ? (
        <AddressForm mode="add" onDone={() => setAddingNew(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setAddingNew(true)}
          className="border border-dashed border-stone-300 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft hover:border-ink hover:text-ink"
        >
          + Add shipping address
        </button>
      )}
    </div>
  );
}

function AddressCard({
  address,
  canDelete,
  onEdit,
}: {
  address: ShipToAddress;
  canDelete: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border border-stone-300 bg-white p-4">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-ink">{address.label}</p>
          {address.isDefault && (
            <span className="border border-signal/40 bg-signal-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-signal-600">
              Default
            </span>
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-ink-soft">
          {address.line1}
          {address.line2 ? `, ${address.line2}` : ""}
          <br />
          {address.city}, {address.state} {address.zip}
        </p>
      </div>
      <div className="flex items-center gap-3 text-xs font-medium">
        <button type="button" onClick={onEdit} className="text-ink-soft hover:text-ink">
          Edit
        </button>
        {!address.isDefault && (
          <form action={setDefaultShipToAddress}>
            <input type="hidden" name="shipToId" value={address.id} />
            <button type="submit" className="text-ink-soft hover:text-ink">
              Set default
            </button>
          </form>
        )}
        {canDelete && (
          <form action={deleteShipToAddress}>
            <input type="hidden" name="shipToId" value={address.id} />
            <button type="submit" className="text-ember hover:underline">
              Delete
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function AddressForm({
  mode,
  address,
  onDone,
}: {
  mode: "add" | "edit";
  address?: ShipToAddress;
  onDone: () => void;
}) {
  const action = mode === "add" ? addShipToAddress : updateShipToAddress;
  const [state, formAction, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await action(prev, formData);
    if (result.success) onDone();
    return result;
  }, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 border border-ink bg-stone-50 p-4">
      {mode === "edit" && address && <input type="hidden" name="shipToId" value={address.id} />}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Label" name="label" defaultValue={address?.label} required />
        <Field label="Address line 1" name="line1" defaultValue={address?.line1} required />
        <Field label="Address line 2" name="line2" defaultValue={address?.line2} />
        <Field label="City" name="city" defaultValue={address?.city} required />
        <Field label="State" name="state" defaultValue={address?.state} required />
        <Field label="ZIP" name="zip" defaultValue={address?.zip} required />
      </div>
      {mode === "add" && (
        <label className="flex items-center gap-2 text-xs text-ink-soft">
          <input type="checkbox" name="isDefault" className="h-3.5 w-3.5" />
          Set as default ship-to address
        </label>
      )}

      {state.error && (
        <p role="alert" className="border border-ember/40 bg-ember-100 px-3 py-2 text-sm text-ember">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : mode === "add" ? "Add address" : "Save address"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="border border-stone-300 bg-white px-3 py-2.5 text-sm text-ink outline-none focus-visible:border-signal"
      />
    </label>
  );
}
