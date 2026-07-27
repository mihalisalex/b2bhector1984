import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service role key. This app has no
 * browser Supabase client by design — the Next.js server is the sole trusted
 * caller (Server Components / Server Actions), so RLS is bypassed here the
 * same way our own session/route guards already gate every page.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);
