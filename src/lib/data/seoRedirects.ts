import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";

export type RedirectSource = "manual" | "slug_change" | "import";

export interface SeoRedirect {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: number;
  enabled: boolean;
  source: RedirectSource;
  notes?: string;
  hitCount: number;
  lastHitAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RedirectInput {
  fromPath: string;
  toPath: string;
  statusCode: number;
  enabled: boolean;
  source?: RedirectSource;
  notes?: string;
}

interface RedirectRow {
  id: string;
  from_path: string;
  to_path: string;
  status_code: number;
  enabled: boolean;
  source: RedirectSource;
  notes: string | null;
  hit_count: number;
  last_hit_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapRedirect(row: RedirectRow): SeoRedirect {
  return {
    id: row.id,
    fromPath: row.from_path,
    toPath: row.to_path,
    statusCode: row.status_code,
    enabled: row.enabled,
    source: row.source,
    notes: row.notes ?? undefined,
    hitCount: row.hit_count,
    lastHitAt: row.last_hit_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Normalises a path the way the proxy will see it, so that a rule authored as
 * "products/old-shoe/" matches a request for "/products/old-shoe". Query
 * strings are stripped — redirect rules match on path only, and the proxy
 * re-attaches the original query to the destination.
 *
 * Absolute destinations (http://, https://) are left completely alone; those
 * are legitimate off-site redirects.
 */
export function normalizePath(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const withoutQuery = trimmed.split(/[?#]/)[0];
  const withLeading = withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
  // Collapse duplicate slashes and drop a trailing one (but keep the root "/").
  const collapsed = withLeading.replace(/\/{2,}/g, "/");
  return collapsed.length > 1 ? collapsed.replace(/\/+$/, "") : collapsed;
}

export async function listRedirects(): Promise<SeoRedirect[]> {
  const { data, error } = await supabaseAdmin
    .from("seo_redirects")
    .select("*")
    .order("created_at", { ascending: false });
  // Pre-migration this table doesn't exist — an empty list is the correct
  // "no redirects configured" answer rather than an error page.
  if (error || !data) return [];
  return (data as RedirectRow[]).map(mapRedirect);
}

export interface RedirectValidation {
  ok: boolean;
  error?: string;
  /** Set when the rule is valid but worth warning about (e.g. it supersedes an existing chain). */
  warning?: string;
}

/**
 * Validates a rule against the rules already in place.
 *
 * Three failure modes matter, in order of severity:
 *  - **Self-redirect** — `/a → /a` is an infinite loop at the HTTP level and
 *    browsers surface it as ERR_TOO_MANY_REDIRECTS.
 *  - **Loop** — following the destination through existing rules arrives back
 *    at the source. Same symptom, harder to spot by eye.
 *  - **Chain** — the destination is itself a redirect source. Not fatal, but
 *    each hop costs a round trip and Google only follows a limited number, so
 *    the rule is rewritten to point at the final destination instead.
 */
export function validateRedirect(
  candidate: { fromPath: string; toPath: string },
  existing: { fromPath: string; toPath: string }[],
): RedirectValidation {
  const from = normalizePath(candidate.fromPath);
  const to = normalizePath(candidate.toPath);

  if (!from) return { ok: false, error: "Source path is required." };
  if (!to) return { ok: false, error: "Destination path is required." };
  if (!from.startsWith("/")) return { ok: false, error: "Source must be a path on this site, starting with /." };
  if (from === to) return { ok: false, error: "Source and destination are the same — that's an infinite loop." };

  // Off-site destinations can't chain or loop through our own table.
  if (/^https?:\/\//i.test(to)) return { ok: true };

  const byFrom = new Map(existing.map((r) => [normalizePath(r.fromPath), normalizePath(r.toPath)]));
  // The candidate participates in the graph too — a rule /b → /a combined with
  // an existing /a → /b only loops once both are present.
  byFrom.set(from, to);

  const seen = new Set<string>([from]);
  let cursor = to;
  let hops = 0;
  while (byFrom.has(cursor)) {
    if (seen.has(cursor)) {
      return { ok: false, error: `This creates a redirect loop: ${[...seen, cursor].join(" → ")}` };
    }
    seen.add(cursor);
    cursor = byFrom.get(cursor)!;
    if (++hops > 25) return { ok: false, error: "This creates a redirect loop." };
  }

  if (cursor !== to) {
    return {
      ok: true,
      warning: `${to} is itself redirected. Point this rule straight at ${cursor} to avoid a redirect chain.`,
    };
  }
  return { ok: true };
}

export async function createRedirect(input: RedirectInput): Promise<void> {
  const { error } = await supabaseAdmin.from("seo_redirects").insert({
    from_path: normalizePath(input.fromPath),
    to_path: normalizePath(input.toPath),
    status_code: input.statusCode,
    enabled: input.enabled,
    source: input.source ?? "manual",
    notes: input.notes ?? null,
  });
  if (error) throw new Error(`seo_redirects: ${error.message}`);
}

/**
 * Upsert used by the slug-change hook and CSV import, where a rule for the
 * same source may already exist and re-creating it should not 409.
 */
export async function upsertRedirect(input: RedirectInput): Promise<void> {
  const { error } = await supabaseAdmin.from("seo_redirects").upsert(
    {
      from_path: normalizePath(input.fromPath),
      to_path: normalizePath(input.toPath),
      status_code: input.statusCode,
      enabled: input.enabled,
      source: input.source ?? "manual",
      notes: input.notes ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "from_path" },
  );
  if (error) throw new Error(`seo_redirects: ${error.message}`);
}

export async function updateRedirect(id: string, input: RedirectInput): Promise<void> {
  const { error } = await supabaseAdmin
    .from("seo_redirects")
    .update({
      from_path: normalizePath(input.fromPath),
      to_path: normalizePath(input.toPath),
      status_code: input.statusCode,
      enabled: input.enabled,
      notes: input.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(`seo_redirects: ${error.message}`);
}

export async function deleteRedirect(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from("seo_redirects").delete().eq("id", id);
  if (error) throw new Error(`seo_redirects: ${error.message}`);
}

export async function deleteRedirects(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabaseAdmin.from("seo_redirects").delete().in("id", ids);
  if (error) throw new Error(`seo_redirects: ${error.message}`);
}

/**
 * Fire-and-forget hit counter for the proxy. Deliberately swallows every
 * error: a redirect must never fail because analytics bookkeeping did.
 */
export async function recordRedirectHit(id: string): Promise<void> {
  try {
    await supabaseAdmin.rpc("bump_redirect_hit", { p_id: id });
  } catch {
    // Intentionally ignored — see doc comment.
  }
}

/**
 * Records the slug a product is moving away from and installs a permanent
 * redirect to its new URL. Called from the product SEO tab's slug editor.
 *
 * Any existing rule that pointed *at* the old URL is re-pointed at the new one
 * in the same pass, so renaming a product twice leaves one hop, not a chain.
 */
export async function recordSlugChange(styleId: string, oldSlug: string, newSlug: string): Promise<void> {
  if (oldSlug === newSlug) return;

  await supabaseAdmin.from("style_slug_history").update({ is_current: false }).eq("style_id", styleId);
  await supabaseAdmin.from("style_slug_history").insert({ style_id: styleId, slug: newSlug, is_current: true });

  const oldPath = `/product/${oldSlug}`;
  const newPath = `/product/${newSlug}`;

  await supabaseAdmin
    .from("seo_redirects")
    .update({ to_path: newPath, updated_at: new Date().toISOString() })
    .eq("to_path", oldPath);

  await upsertRedirect({
    fromPath: oldPath,
    toPath: newPath,
    statusCode: 301,
    enabled: true,
    source: "slug_change",
    notes: `Automatic — product slug changed from "${oldSlug}" to "${newSlug}".`,
  });
}

export async function listSlugHistory(styleId: string): Promise<{ slug: string; isCurrent: boolean; createdAt: string }[]> {
  const { data, error } = await supabaseAdmin
    .from("style_slug_history")
    .select("slug, is_current, created_at")
    .eq("style_id", styleId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as { slug: string; is_current: boolean; created_at: string }[]).map((row) => ({
    slug: row.slug,
    isCurrent: row.is_current,
    createdAt: row.created_at,
  }));
}

