import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Keeps the Supabase project awake.
 *
 * Free-tier Supabase projects pause automatically after 7 days with zero API
 * activity — the project stays intact, but every request 500s until someone
 * manually un-pauses it from the dashboard. That's a real risk for a low-
 * traffic launch, and this route exists purely to prevent it: one cheap,
 * read-only query, once a day, triggered by Vercel Cron (see vercel.json).
 * No new dependency, no third-party uptime service, no cost.
 *
 * If/when the project moves to Supabase Pro (which never pauses), this route
 * and its cron entry can simply be deleted — it does nothing else.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { error } = await supabaseAdmin.from("box_types").select("id").limit(1);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  // Housekeeping, since this already runs daily and already holds a service-role client.
  //
  // Expired sessions were never deleted — only ignored. `getSessionAccountId` re-checks
  // `expires_at` on every request, so a stale row was harmless, but the table grew forever
  // (27 of 46 rows were already dead) and every one of them is a bearer token sitting in
  // the database long after it stopped being useful. Cheap to sweep, so sweep it.
  //
  // Best-effort: a failed sweep must never turn the keep-alive ping — the thing actually
  // stopping the Supabase project from pausing — into a 500.
  let prunedSessions: number | null = null;
  try {
    const { count, error: pruneError } = await supabaseAdmin
      .from("sessions")
      .delete({ count: "exact" })
      .lt("expires_at", new Date().toISOString());
    if (pruneError) throw new Error(pruneError.message);
    prunedSessions = count ?? 0;
  } catch (err) {
    console.error("[cron] session prune failed (keep-alive itself succeeded):", err);
  }

  // Used single-use reset tokens are dead weight for the same reason.
  try {
    await supabaseAdmin
      .from("password_reset_tokens")
      .delete()
      .lt("expires_at", new Date().toISOString());
  } catch (err) {
    console.error("[cron] reset-token prune failed:", err);
  }

  return Response.json({ ok: true, pingedAt: new Date().toISOString(), prunedSessions });
}
