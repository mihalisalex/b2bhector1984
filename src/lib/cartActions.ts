"use server";

import { getCurrentAccount } from "@/lib/session";
import { getCart, saveCart, type StoredCartLine } from "@/lib/data/cart";
import { mergeCarts } from "@/lib/cartMerge";
import type { BoxTypeId } from "@/lib/types";

const BOX_TYPE_IDS: BoxTypeId[] = ["box8", "box10", "box12"];

/**
 * Never trust the client's cart shape. These lines arrive from localStorage, which is a
 * user-writable store, and they end up in a database row — so every field is checked and
 * anything malformed is dropped rather than stored. Nothing here is priced; checkout re-reads
 * prices and stock from the catalogue regardless of what a cart says.
 */
function sanitize(lines: unknown): StoredCartLine[] {
  if (!Array.isArray(lines)) return [];
  const clean: StoredCartLine[] = [];
  for (const raw of lines.slice(0, 200)) {
    if (!raw || typeof raw !== "object") continue;
    const line = raw as Record<string, unknown>;
    const styleId = typeof line.styleId === "string" ? line.styleId.slice(0, 100) : "";
    const colorwayId = typeof line.colorwayId === "string" ? line.colorwayId.slice(0, 100) : "";
    const boxTypeId = line.boxTypeId as BoxTypeId;
    const qty = Number(line.qty);
    if (!styleId || !colorwayId) continue;
    if (!BOX_TYPE_IDS.includes(boxTypeId)) continue;
    if (!Number.isInteger(qty) || qty <= 0 || qty > 999) continue;
    clean.push({ styleId, colorwayId, boxTypeId, qty });
  }
  return clean;
}

/**
 * Reconciles the device's cart with the one stored for this account and returns the result.
 *
 * Called once when the cart provider mounts. The account comes from the session rather than
 * a parameter, so one buyer can never read or write another's cart by passing an id.
 *
 * Returns the merged cart even when persistence fails, so a database problem degrades to the
 * old localStorage-only behaviour instead of emptying somebody's order.
 */
export async function syncCartAction(localLines: unknown): Promise<StoredCartLine[]> {
  const account = await getCurrentAccount();
  const local = sanitize(localLines);
  if (!account) return local;

  try {
    const remote = await getCart(account.id);
    const merged = mergeCarts(local, remote);
    await saveCart(account.id, merged);
    return merged;
  } catch (err) {
    console.error("syncCartAction failed, falling back to the local cart:", err);
    return local;
  }
}

/**
 * Mirrors the device's cart to the server after a change. Fire-and-forget from the client's
 * point of view: localStorage has already been written, so a failure here costs cross-device
 * sync until the next change, not the cart.
 */
export async function persistCartAction(lines: unknown): Promise<void> {
  const account = await getCurrentAccount();
  if (!account) return;
  try {
    await saveCart(account.id, sanitize(lines));
  } catch (err) {
    console.error("persistCartAction failed; the cart is still in localStorage:", err);
  }
}
