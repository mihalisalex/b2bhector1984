import { createClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client, used only to PUT a file straight to Storage
 * via a short-lived signed upload URL minted server-side (supabaseAdmin).
 * The anon key can't read/write anything on its own — every bucket has no
 * RLS policy granting anon access; the signed token is what authorizes the
 * one upload. This exists specifically so large photo uploads don't have to
 * pass through a Vercel serverless function, which caps request bodies well
 * under what a real camera/phone photo needs.
 */
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } },
);
