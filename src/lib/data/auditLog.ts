import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";

export interface AuditEntry {
  id: string;
  actorAccountId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  detail?: string;
  createdAt: string;
}

interface AuditRow {
  id: string;
  actor_account_id: string | null;
  action: string;
  target_type: string;
  target_id: string;
  detail: string | null;
  created_at: string;
}

function mapEntry(row: AuditRow): AuditEntry {
  return {
    id: row.id,
    actorAccountId: row.actor_account_id,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    detail: row.detail ?? undefined,
    createdAt: row.created_at,
  };
}

/** Best-effort — never blocks or fails the admin action it's called from. */
export async function logAudit(
  actorAccountId: string,
  action: string,
  targetType: string,
  targetId: string,
  detail?: string,
): Promise<void> {
  const { error } = await supabaseAdmin.from("audit_log").insert({
    actor_account_id: actorAccountId,
    action,
    target_type: targetType,
    target_id: targetId,
    detail: detail ?? null,
  });
  if (error) console.error(`audit_log insert failed: ${error.message}`);
}

/** Returns an empty list (with a console warning) rather than throwing if `audit_log` doesn't exist yet. */
export async function listRecentAuditEntries(limit = 200): Promise<AuditEntry[]> {
  const { data, error } = await supabaseAdmin
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.warn(`audit_log query failed (has migration 0012 been run?): ${error.message}`);
    return [];
  }
  return (data ?? []).map(mapEntry);
}

/** Page-based audit log listing with an optional action/target/detail search — unlike
 * `listRecentAuditEntries`'s flat 200-row cap, this scales past that with real pagination. */
export async function listAuditEntriesPage(
  page: number,
  pageSize: number,
  query?: string,
): Promise<{ entries: AuditEntry[]; total: number }> {
  let q = supabaseAdmin.from("audit_log").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (query?.trim()) {
    const term = query.trim().replace(/[%,]/g, "");
    q = q.or(`action.ilike.%${term}%,target_type.ilike.%${term}%,target_id.ilike.%${term}%,detail.ilike.%${term}%`);
  }
  const from = (page - 1) * pageSize;
  const { data, error, count } = await q.range(from, from + pageSize - 1);
  if (error) {
    console.warn(`audit_log query failed (has migration 0012 been run?): ${error.message}`);
    return { entries: [], total: 0 };
  }
  return { entries: (data ?? []).map(mapEntry), total: count ?? 0 };
}
