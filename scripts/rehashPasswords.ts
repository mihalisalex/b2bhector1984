/**
 * One-off: hashes any plaintext passwords still stored in `accounts` from
 * before passwords were hashed. Idempotent — skips rows whose password
 * already looks like a `salt:hash` pair, so it's safe to run more than once
 * or after future plaintext seed inserts. Run once:
 *
 *   npm run rehash-passwords
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { hashPassword } from "../src/lib/passwords";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

// scrypt output here is `<32-hex-char salt>:<128-hex-char hash>` — anything else is still plaintext.
const HASH_SHAPE = /^[0-9a-f]{32}:[0-9a-f]{128}$/;

async function main() {
  const { data, error } = await supabase.from("accounts").select("id, password");
  if (error) throw new Error(`accounts: ${error.message}`);

  const toRehash = (data ?? []).filter((a) => !HASH_SHAPE.test(a.password));
  if (toRehash.length === 0) {
    console.log("All account passwords are already hashed.");
    return;
  }

  for (const account of toRehash) {
    const hashed = await hashPassword(account.password);
    const { error: updateError } = await supabase.from("accounts").update({ password: hashed }).eq("id", account.id);
    if (updateError) throw new Error(`accounts (${account.id}): ${updateError.message}`);
    console.log(`  rehashed ${account.id}`);
  }
  console.log(`Rehashed ${toRehash.length} account password(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
