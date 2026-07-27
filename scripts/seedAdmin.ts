/**
 * Seeds the admin account (see supabase/migrations/0002_admin_seed.sql).
 * Reads credentials from .env.local (ADMIN_EMAIL / ADMIN_PASSWORD) so the
 * real password never lives in source. Run once:
 *
 *   npm run seed:admin
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
if (!adminEmail || !adminPassword) {
  console.error("Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { error } = await supabase.from("accounts").upsert(
    {
      id: "acct-admin-01",
      business_name: "Hector 1984 HQ",
      contact_name: "House Admin",
      email: adminEmail,
      password: adminPassword,
      tier: "vip",
      status: "active",
      credit_terms: "net60",
      credit_limit: 0,
      resale_cert_id: "N/A",
      business_type: "Internal admin",
      store_location: "Portland, OR",
      expected_volume: "N/A",
      applied_at: new Date().toISOString(),
      approved_at: new Date().toISOString(),
      role: "admin",
    },
    { onConflict: "id" },
  );
  if (error) throw new Error(`accounts: ${error.message}`);
  console.log(`Admin account seeded: ${adminEmail}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
