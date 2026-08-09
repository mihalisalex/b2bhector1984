import "server-only";
import { headers } from "next/headers";

/**
 * Fixed-window rate limiter for the handful of *unauthenticated* server actions —
 * login, password-reset requests, and wholesale applications. Everything else on this
 * site is already behind `requirePermission`/`getCurrentAccount`, so an attacker has to
 * get through one of these three first.
 *
 * ## Why module state, and what it does and doesn't buy
 *
 * Counters live in a module-scoped Map, the same pattern (and the same trade-off) as
 * `redirectEngine.ts`'s rule cache: on a serverless platform this is per-instance, so a
 * determined attacker spread across many cold instances gets more attempts than the
 * nominal limit, and a redeploy resets every window.
 *
 * That is a real limitation and worth stating plainly rather than implying this is
 * airtight. It is still worth having: credential-stuffing and email-bombing runs are
 * high-volume and bursty, which is exactly the traffic pattern that keeps hitting a warm
 * instance, so in practice this stops the attack shape these endpoints actually face —
 * with no new dependency, no shared store, and no migration to run before it works.
 *
 * If this ever needs to be strict (per-account lockout, or a limit an attacker can't
 * widen by fanning out), move the counter into Supabase or a KV store behind the same
 * `checkRateLimit` signature — no call site has to change.
 *
 * Fails **open**: any error resolving the client IP lets the request through. Locking
 * real buyers out of their own login because a header was missing is a worse failure
 * than allowing an extra attempt.
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

/** Bound the map so a spray of distinct IPs can't grow it without limit. */
const MAX_TRACKED_KEYS = 10_000;

function prune(now: number) {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
  // Still oversized after dropping expired windows — drop the oldest-expiring entries.
  if (windows.size > MAX_TRACKED_KEYS) {
    const byExpiry = [...windows.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
    for (const [key] of byExpiry.slice(0, windows.size - MAX_TRACKED_KEYS)) windows.delete(key);
  }
}

/**
 * Best-effort client IP. `x-forwarded-for` is a comma-separated chain; the left-most
 * entry is the original client. Vercel also sets `x-real-ip`.
 */
export async function clientIp(): Promise<string | null> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first) return first;
    }
    return h.get("x-real-ip");
  } catch {
    return null;
  }
}

export interface RateLimitResult {
  allowed: boolean;
  /** Whole seconds until the current window resets. 0 when allowed. */
  retryAfterSeconds: number;
}

const ALLOWED: RateLimitResult = { allowed: true, retryAfterSeconds: 0 };

/**
 * Counts one hit against `action` for the calling client and reports whether it may
 * proceed. Callers that should only penalise *failures* (login) must call this after
 * deciding the attempt failed — see `login`.
 */
export async function checkRateLimit(
  action: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): Promise<RateLimitResult> {
  const ip = await clientIp();
  // No resolvable IP (local dev, an unusual proxy) — fail open, see the module doc.
  if (!ip) return ALLOWED;

  const now = Date.now();
  prune(now);

  const key = `${action}:${ip}`;
  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return ALLOWED;
  }

  existing.count += 1;
  if (existing.count > limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }
  return ALLOWED;
}

/** Clears a client's window for an action — used after a *successful* login so a buyer who
 * mistyped a few times isn't still carrying those failures once they get in. */
export async function resetRateLimit(action: string): Promise<void> {
  const ip = await clientIp();
  if (ip) windows.delete(`${action}:${ip}`);
}

/** Human-facing wait text, e.g. "30 seconds" / "3 minutes". */
export function formatRetryAfter(seconds: number): string {
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}
