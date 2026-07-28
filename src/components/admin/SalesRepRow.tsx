"use client";

import { useActionState } from "react";
import { updateSalesRepAction, deleteSalesRepAction } from "@/lib/adminActions";
import type { FormState } from "@/lib/actions";
import type { AdminSalesRep } from "@/lib/data/salesReps";

const initialState: FormState = {};

const inputClass =
  "w-full border border-stone-300 bg-white px-2 py-1.5 text-sm outline-none focus-visible:border-signal";

export function SalesRepRow({ rep }: { rep: AdminSalesRep }) {
  const [updateState, updateAction] = useActionState(updateSalesRepAction.bind(null, rep.id), initialState);
  const [deleteState, deleteAction] = useActionState(deleteSalesRepAction.bind(null, rep.id), initialState);

  return (
    <tr className="border-b border-stone-200 last:border-b-0 align-top">
      <td className="px-3 py-3">
        <form id={`rep-form-${rep.id}`} action={updateAction} className="grid grid-cols-2 gap-2">
          <input name="name" defaultValue={rep.name} placeholder="Name" className={inputClass} />
          <input name="title" defaultValue={rep.title} placeholder="Title" className={inputClass} />
          <input name="email" type="email" defaultValue={rep.email} placeholder="Email" className={inputClass} />
          <input name="phone" defaultValue={rep.phone} placeholder="Phone" className={inputClass} />
          <input name="initials" defaultValue={rep.initials} placeholder="Initials" className={inputClass} />
          <input name="territory" defaultValue={rep.territory} placeholder="Territory" className={inputClass} />
        </form>
        {updateState.error && <p className="mt-1 text-[11px] text-ember">{updateState.error}</p>}
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-col items-end gap-2">
          <button
            type="submit"
            form={`rep-form-${rep.id}`}
            className="border border-ink bg-ink px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85"
          >
            Save
          </button>
          <form action={deleteAction}>
            <button
              type="submit"
              className="text-xs font-medium uppercase tracking-wide text-ink-soft hover:text-ember"
            >
              Delete
            </button>
          </form>
          {deleteState.error && <p className="max-w-[160px] text-right text-[11px] text-ember">{deleteState.error}</p>}
        </div>
      </td>
    </tr>
  );
}
