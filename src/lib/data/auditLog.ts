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
