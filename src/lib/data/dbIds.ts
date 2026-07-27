import "server-only";

/**
 * Join-only rows (colorways, ship-to addresses, order-line colorway refs) use a
 * globally-unique `text` id in the DB formed as `${parentId}-${localId}` (see
 * supabase/migrations/0001_init.sql and scripts/seed.ts), but the app's types
 * use the short id local to its parent (e.g. "c1", "ship-1"). These helpers
 * cross that boundary in both directions.
 */
export function toDbId(parentId: string, localId: string): string {
  return `${parentId}-${localId}`;
}

export function fromDbId(parentId: string, dbId: string): string {
  const prefix = `${parentId}-`;
  return dbId.startsWith(prefix) ? dbId.slice(prefix.length) : dbId;
}

/** PostgREST can return `numeric` columns as strings; coerce defensively. */
export function toNumber(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}
