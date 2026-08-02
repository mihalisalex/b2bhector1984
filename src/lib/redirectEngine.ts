/**
 * Redirect lookup for `proxy.ts`.
 *
 * Deliberately built on a bare `fetch` against Supabase's REST endpoint rather
 * than the Supabase SDK, and with no `server-only` import: the proxy runs
 * ahead of the app on every matched request, and pulling the SDK (plus its
 * transitive deps) into that bundle would slow down every single page load to
 * serve a table that is usually empty.
 *
 * ## Caching
 *
 * Redirect rules are read at most once per TTL per server instance and held in
 * a module-scoped map. The Next docs warn against relying on shared module
 * state in proxy, because it may be replicated across isolates — that warning
 * is respected here in the sense that correctness never depends on the cache:
 * a cold or evicted instance simply re-fetches. The worst case is a redundant
 * fetch, never a wrong answer. A newly-added rule takes effect within
 * REDIRECT_TTL_MS on instances that are already warm.
 *
 * If the fetch fails (network blip, missing table before migration 0025), the
 * engine fails **open** — it returns "no redirect" and lets the request through
 * rather than 500-ing the whole site over a redirect table.
 */

export interface RedirectRule {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: number;
}

export const REDIRECT_TTL_MS = 60_000;

interface CacheEntry {
  rules: Map<string, RedirectRule>;
  fetchedAt: number;
}

let cache: CacheEntry | undefined;
/** In-flight fetch, so a burst of concurrent requests on a cold instance issues one query. */
let inFlight: Promise<CacheEntry> | undefined;

function normalize(path: string): string {
  const withoutQuery = path.split(/[?#]/)[0];
  const collapsed = (withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`).replace(/\/{2,}/g, "/");
  return collapsed.length > 1 ? collapsed.replace(/\/+$/, "") : collapsed;
}

async function fetchRules(): Promise<CacheEntry> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const empty: CacheEntry = { rules: new Map(), fetchedAt: Date.now() };
  if (!url || !key) return empty;

  try {
    const response = await fetch(
      `${url}/rest/v1/seo_redirects?select=id,from_path,to_path,status_code&enabled=eq.true`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        // Next would otherwise try to apply its own data cache to this call.
        cache: "no-store",
      },
    );
    if (!response.ok) return empty;

    const rows = (await response.json()) as {
      id: string;
      from_path: string;
      to_path: string;
      status_code: number;
    }[];

    const rules = new Map<string, RedirectRule>();
    for (const row of rows) {
      rules.set(normalize(row.from_path), {
        id: row.id,
        fromPath: row.from_path,
        toPath: row.to_path,
        statusCode: row.status_code,
      });
    }
    return { rules, fetchedAt: Date.now() };
  } catch {
    // Fail open — see the module doc comment.
    return empty;
  }
}

async function getRules(): Promise<Map<string, RedirectRule>> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < REDIRECT_TTL_MS) return cache.rules;
  if (!inFlight) {
    inFlight = fetchRules().then((entry) => {
      cache = entry;
      inFlight = undefined;
      return entry;
    });
  }
  return (await inFlight).rules;
}

/**
 * Resolves a request path to its final destination, following chains so a
 * visitor never pays for more than one round trip even when the rules
 * themselves are chained. Loops are broken after a bounded number of hops and
 * treated as "no redirect" — a 200 on the original URL is a far better failure
 * mode than ERR_TOO_MANY_REDIRECTS.
 */
export async function resolveRedirect(
  pathname: string,
): Promise<{ destination: string; statusCode: number; ruleId: string } | null> {
  const rules = await getRules();
  if (rules.size === 0) return null;

  const start = normalize(pathname);
  let rule = rules.get(start);
  if (!rule) return null;

  const seen = new Set<string>([start]);
  let destination = rule.toPath;
  let statusCode = rule.statusCode;
  const ruleId = rule.id;

  // Follow the chain to its end.
  for (let hop = 0; hop < 10; hop++) {
    if (/^https?:\/\//i.test(destination)) break;
    const next = normalize(destination);
    if (seen.has(next)) return null; // loop — see doc comment
    seen.add(next);
    rule = rules.get(next);
    if (!rule) break;
    destination = rule.toPath;
    statusCode = rule.statusCode;
  }

  if (normalize(destination) === start && !/^https?:\/\//i.test(destination)) return null;
  return { destination, statusCode, ruleId };
}

/**
 * Fire-and-forget hit counter, so the redirect manager can show which rules are
 * actually carrying traffic (and which are dead weight that can be retired).
 *
 * Never awaited by the caller and never allowed to throw: bookkeeping must not
 * delay or break a redirect. The proxy hands this to `event.waitUntil` so the
 * serverless instance stays alive long enough for it to land.
 */
export function recordRedirectHit(ruleId: string): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return Promise.resolve();

  return fetch(`${url}/rest/v1/rpc/bump_redirect_hit`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_id: ruleId }),
    cache: "no-store",
  })
    .then(() => undefined)
    .catch(() => undefined);
}

/** Test/admin hook: drops the cache so a just-saved rule takes effect immediately in dev. */
export function clearRedirectCache(): void {
  cache = undefined;
  inFlight = undefined;
}
