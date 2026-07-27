import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service role key. This app has no
 * browser Supabase client by design — the Next.js server is the sole trusted
 * caller (Server Components / Server Actions), so RLS is bypassed here the
 * same way our own session/route guards already gate every page.
 *
 * Built lazily (not at module load) so that importing this module doesn't
 * blow up Next's build-time page-data collection when env vars aren't
 * present in that phase — the error only surfaces if a request actually
 * needs Supabase without the vars configured.
 */
let client: SupabaseClient | undefined;

function getSupabaseAdmin(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables",
      );
    }
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabaseAdmin(), prop, receiver);
  },
});
