"use client";

import { useActionState, useEffect, useState } from "react";
import { formatDate } from "@/lib/format";
import {
  updateInventoryMetaAction,
  updateProductInventoryLevelAction,
  updateReservedStockAction,
  createWarehouseAction,
} from "@/lib/productActions";
import { updateAvailableBoxTypesAction } from "@/lib/adminActions";
import { useToastResult } from "@/components/ui/ToastProvider";
import { TextField, CheckboxField, SaveBar } from "@/components/admin/products/editor/FormField";
import { BOX_TYPES } from "@/lib/data/boxTypes";
import type { FormState } from "@/lib/actions";
import type { InventoryMovement, Style, Warehouse } from "@/lib/types";
import type { WarehouseStockRow } from "@/lib/data/inventory";

const initialState: FormState = {};

export function InventoryTab({
  style,
  warehouses,
  warehouseStock,
  movements,
  canEdit,
}: {
  style: Style;
  warehouses: Warehouse[];
  warehouseStock: WarehouseStockRow[];
  movements: InventoryMovement[];
  canEdit: boolean;
}) {
  const [warehouseId, setWarehouseId] = useState(warehouses.find((w) => w.isDefault)?.id ?? warehouses[0]?.id ?? "main");
  const offeredBoxTypes = BOX_TYPES.filter((b) => style.availableBoxTypes.includes(b.id));

  const action = updateInventoryMetaAction.bind(null, style.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const showResult = useToastResult();
  useEffect(() => {
    if (state.error || state.success) showResult(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const stockFor = (colorwayId: string, boxTypeId: string) =>
    warehouseStock.find((r) => r.colorwayId === colorwayId && r.boxTypeId === boxTypeId && r.warehouseId === warehouseId);

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Stock by warehouse</h3>
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none focus-visible:border-signal"
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}{w.location ? ` — ${w.location}` : ""}</option>
            ))}
          </select>
        </div>

        <div className="scroll-thin mt-3 overflow-x-auto border border-stone-300 bg-white">
          <table className="w-full min-w-[500px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-300 bg-stone-100 text-left text-[11px] uppercase tracking-wide text-ink-soft">
                <th className="px-4 py-2.5">Variant</th>
                {offeredBoxTypes.map((box) => (
                  <th key={box.id} className="px-3 py-2.5 text-right">{box.label} on hand / reserved</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {style.colorways.map((colorway) => (
                <tr key={colorway.id} className="border-b border-stone-200 last:border-b-0">
                  <td className="px-4 py-2 text-ink">{colorway.name}</td>
                  {offeredBoxTypes.map((box) => {
                    const row = stockFor(colorway.id, box.id);
                    return (
                      <td key={box.id} className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <form action={updateProductInventoryLevelAction.bind(null, style.id)} className="inline-flex">
                            <input type="hidden" name="colorwayId" value={colorway.id} />
                            <input type="hidden" name="boxTypeId" value={box.id} />
                            <input type="hidden" name="warehouseId" value={warehouseId} />
                            <input
                              name="onHand"
                              type="number"
                              min={0}
                              disabled={!canEdit}
                              defaultValue={row?.onHand ?? 0}
                              onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                              aria-label={`${colorway.name} ${box.label} on hand`}
                              className="font-mono-tab w-14 border border-stone-300 bg-white px-1.5 py-1 text-right text-sm outline-none focus-visible:border-signal disabled:bg-stone-100"
                            />
                          </form>
                          <span className="text-ink-soft">/</span>
                          <form action={updateReservedStockAction.bind(null, style.id)} className="inline-flex">
                            <input type="hidden" name="colorwayId" value={colorway.id} />
                            <input type="hidden" name="boxTypeId" value={box.id} />
                            <input type="hidden" name="warehouseId" value={warehouseId} />
                            <input
                              name="reserved"
                              type="number"
                              min={0}
                              disabled={!canEdit}
                              defaultValue={row?.reserved ?? 0}
                              onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                              aria-label={`${colorway.name} ${box.label} reserved`}
                              className="font-mono-tab w-14 border border-stone-300 bg-white px-1.5 py-1 text-right text-sm outline-none focus-visible:border-signal disabled:bg-stone-100"
                            />
                          </form>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {canEdit && (
          <form action={async (formData) => { const r = await createWarehouseAction(initialState, formData); showResult(r); }} className="mt-3 flex items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">New warehouse</label>
              <input name="name" placeholder="Warehouse name" className="border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none focus-visible:border-signal" />
            </div>
            <input name="location" placeholder="Location (optional)" className="border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none focus-visible:border-signal" />
            <button type="submit" className="border border-ink px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink hover:bg-ink hover:text-white">
              Add
            </button>
          </form>
        )}
      </section>

      <section className="border-t border-stone-300 pt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Box sizes offered</h3>
        <p className="mt-1 text-xs text-ink-soft">Not every style ships in all three pre-packs — uncheck any this style doesn&rsquo;t offer.</p>
        <form action={updateAvailableBoxTypesAction} className="mt-3 flex flex-wrap items-center gap-5">
          <input type="hidden" name="styleId" value={style.id} />
          {BOX_TYPES.map((box) => (
            <label key={box.id} className="flex cursor-pointer items-center gap-2 text-sm text-ink">
              <input type="checkbox" name={box.id} defaultChecked={style.availableBoxTypes.includes(box.id)} disabled={!canEdit} className="h-4 w-4 accent-ink" />
              {box.label}
            </label>
          ))}
          {canEdit && (
            <button type="submit" className="border border-ink bg-ink px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85">
              Save
            </button>
          )}
        </form>
      </section>

      <form action={formAction} className="space-y-5 border-t border-stone-300 pt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Identifiers & thresholds</h3>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Barcode" name="barcode" defaultValue={style.barcode} disabled={!canEdit} />
          <TextField label="GTIN" name="gtin" defaultValue={style.gtin} disabled={!canEdit} />
          <TextField label="UPC" name="upc" defaultValue={style.upc} disabled={!canEdit} />
          <TextField label="MPN" name="mpn" defaultValue={style.mpn} disabled={!canEdit} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Low stock threshold" name="lowStockThreshold" type="number" defaultValue={style.lowStockThreshold} disabled={!canEdit} />
          <TextField label="Incoming stock" name="incomingStock" type="number" defaultValue={style.incomingStock} disabled={!canEdit} />
        </div>
        <div className="flex gap-6">
          <CheckboxField label="Track inventory" name="trackInventory" defaultChecked={style.trackInventory} disabled={!canEdit} />
          <CheckboxField label="Allow backorders" name="allowBackorder" defaultChecked={style.allowBackorder} disabled={!canEdit} />
        </div>
        {canEdit && <SaveBar isPending={isPending} />}
      </form>

      <section className="border-t border-stone-300 pt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Inventory movements log</h3>
        <div className="scroll-thin mt-3 max-h-80 overflow-y-auto overflow-x-auto border border-stone-300 bg-white">
          <table className="w-full min-w-[500px] border-collapse text-sm">
            <thead>
              <tr className="sticky top-0 border-b border-stone-300 bg-stone-100 text-left text-[11px] uppercase tracking-wide text-ink-soft">
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Variant / box</th>
                <th className="px-3 py-2">Warehouse</th>
                <th className="px-3 py-2 text-right">Change</th>
                <th className="px-3 py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-b border-stone-200 last:border-b-0">
                  <td className="px-3 py-2 text-ink-soft">{formatDate(m.createdAt)}</td>
                  <td className="px-3 py-2 text-ink">{m.colorwayId} / {m.boxTypeId}</td>
                  <td className="px-3 py-2 text-ink-soft">{m.warehouseId}</td>
                  <td className={`font-mono-tab px-3 py-2 text-right ${m.qtyDelta < 0 ? "text-ember" : "text-positive"}`}>
                    {m.qtyDelta > 0 ? "+" : ""}{m.qtyDelta}
                  </td>
                  <td className="px-3 py-2 text-ink-soft">{m.reason}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-ink-soft">No movements recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
