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
  return Response.json({ ok: true, pingedAt: new Date().toISOString() });
}
