import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { fromDbId, toDbId, toNumber } from "@/lib/data/dbIds";
import { SUPPORT_EMAIL } from "@/lib/contact";
import type { Account, AdminRole, SalesRep } from "@/lib/types";

/**
 * Shown to any account with no `rep_id` — including every account approved through the
 * bulk-approve path, which doesn't ask for one.
 *
 * Deliberately carries **no phone number**. It used to specify `(503) 555-0100`, a reserved
 * fictional US number left over from the original seed data, and it rendered as a live
 * `tel:` link on the dashboard, on every product page's trust strip, in the shop footer and
 * on the admin order view. Every consumer now treats `phone` as optional and falls back to
 * the email alone, so the honest "we haven't assigned you a rep yet, here's the general
 * inbox" state is what a buyer actually sees.
 *
 * If a real general/switchboard number exists, adding it here is the only change needed —
 * every render site already handles a present phone.
 */
const UNASSIGNED_REP: SalesRep = {
  name: "New Accounts Team",
  title: "Wholesale Onboarding",
  email: SUPPORT_EMAIL,
  initials: "NA",
  territory: "Unassigned — a territory rep will follow up within 2 business days",
};

interface AccountRow {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  /** Absent entirely pre-migration 0026 (select("*") just omits it), null for
   * any account created before this feature existed. */
  phone?: string | null;
  password: string;
  status: Account["status"];
  credit_terms: Account["creditTerms"];
  credit_limit: number | string;
  price_multiplier: number | string;
  /** Absent entirely pre-migration 0034, null for every account until an admin sets one —
   * see `Account.minOrderPairs`'s doc comment. */
  min_order_pairs?: number | string | null;
  /** Migration 0037. Optional so this mapper still works pre-migration. */
  locale?: string | null;
  locale_inferred?: boolean | null;
  resale_cert_id: string;
  business_type: string;
  store_location: string;
  expected_volume: string;
  applied_at: string;
  approved_at: string | null;
  role: Account["role"];
  admin_role?: Account["adminRole"] | null;
  rep_id: string | null;
  sales_reps: {
    name: string;
    title: string;
    email: string;
    phone: string;
    initials: string;
    territory: string;
  } | null;
}

interface ShipToRow {
  id: string;
  account_id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
  is_default: boolean;
}

async function mapAccount(row: AccountRow): Promise<Account> {
  const { data: shipToRows, error } = await supabaseAdmin
    .from("ship_to_addresses")
    .select("*")
    .eq("account_id", row.id);
  if (error) throw new Error(`ship_to_addresses: ${error.message}`);

  const shipTo = ((shipToRows ?? []) as ShipToRow[]).map((s) => ({
    id: fromDbId(row.id, s.id),
    label: s.label,
    line1: s.line1,
    line2: s.line2 ?? undefined,
    city: s.city,
    state: s.state,
    zip: s.zip,
    isDefault: s.is_default,
  }));

  return {
    id: row.id,
    businessName: row.business_name,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone ?? undefined,
    password: row.password,
    status: row.status,
    creditTerms: row.credit_terms,
    creditLimit: toNumber(row.credit_limit),
    priceMultiplier: toNumber(row.price_multiplier),
    minOrderPairs: row.min_order_pairs == null ? undefined : toNumber(row.min_order_pairs),
    locale: row.locale ?? undefined,
    localeInferred: row.locale_inferred ?? undefined,
    resaleCertId: row.resale_cert_id,
    businessType: row.business_type,
    storeLocation: row.store_location,
    expectedVolume: row.expected_volume,
    appliedAt: row.applied_at,
    approvedAt: row.approved_at ?? undefined,
    shipTo,
    rep: row.sales_reps
      ? {
          name: row.sales_reps.name,
          title: row.sales_reps.title,
          email: row.sales_reps.email,
          phone: row.sales_reps.phone,
          initials: row.sales_reps.initials,
          territory: row.sales_reps.territory,
        }
      : UNASSIGNED_REP,
    repId: row.rep_id ?? undefined,
    role: row.role,
    adminRole: row.admin_role ?? (row.role === "admin" ? "super_admin" : undefined),
  };
}

/**
 * Case-insensitive email lookup, without letting the caller write the pattern.
 *
 * This used `.ilike("email", email)` on the raw input, which turns a login form into a
 * pattern-matching primitive: `%` matches anything, `_` matches any single character. It
 * was never an authentication bypass — the submitted password still has to verify against
 * whichever row comes back — but `%` matched every account and `.limit(1)` then picked an
 * arbitrary one, and a real address containing `_` could match a different account.
 *
 * `%`, `_` and the escape character itself are escaped so the input can only ever be a
 * literal. `ilike` is kept (rather than `.eq`) because `accounts.email` is stored with
 * whatever casing the applicant typed, so an exact match would reject a valid login.
 */
export async function getAccountByEmail(email: string): Promise<Account | undefined> {
  const literal = email.replace(/[\\%_]/g, (ch) => `\\${ch}`);
  const { data, error } = await supabaseAdmin
    .from("accounts")
    .select("*, sales_reps(*)")
    .ilike("email", literal)
    .limit(1);
  if (error) throw new Error(`accounts: ${error.message}`);
  const row = data?.[0] as AccountRow | undefined;
  return row ? mapAccount(row) : undefined;
}

/** Active/approved buyer accounts, for the admin price-multiplier list — newest first. */
export async function getAllAccounts(): Promise<Account[]> {
  const { data, error } = await supabaseAdmin
    .from("accounts")
    .select("*, sales_reps(*)")
    .eq("role", "buyer")
    .order("business_name");
  if (error) throw new Error(`accounts: ${error.message}`);
  return Promise.all(((data ?? []) as AccountRow[]).map(mapAccount));
}

/**
 * Staff accounts — everything with `role = 'admin'`, which `getAllAccounts` deliberately
 * excludes because that list is the buyer pricing table.
 *
 * Exists so `/admin/permissions` can show who actually holds each role. Until this landed
 * there was no screen anywhere that listed staff, which is why the permission matrix was
 * decorative: the page told you to "assign a role from the account's admin record" and no
 * such record was reachable.
 */
export async function getAdminAccounts(): Promise<Account[]> {
  const { data, error } = await supabaseAdmin
    .from("accounts")
    .select("*, sales_reps(*)")
    .eq("role", "admin")
    .order("contact_name");
  if (error) throw new Error(`accounts: ${error.message}`);
  return Promise.all(((data ?? []) as AccountRow[]).map(mapAccount));
}

/**
 * Writes `accounts.admin_role`. Nothing wrote this column before — a staff account fell
 * through `mapAccount`'s `?? (role === "admin" ? "super_admin" : undefined)` default, so
 * every admin silently had every permission regardless of what the matrix said.
 */
export async function updateAdminRole(id: string, adminRole: AdminRole): Promise<void> {
  const { error } = await supabaseAdmin.from("accounts").update({ admin_role: adminRole }).eq("id", id);
  if (error) throw new Error(`accounts: ${error.message}`);
}

/** How many staff currently hold `super_admin`, so the last one can't be demoted away. */
export async function countSuperAdmins(): Promise<number> {
  const { data, error } = await supabaseAdmin.from("accounts").select("id, admin_role").eq("role", "admin");
  if (error) throw new Error(`accounts: ${error.message}`);
  // The null fallback counts: an admin row with no explicit admin_role resolves to
  // super_admin everywhere else, so it has to count as one here too.
  return (data ?? []).filter((row) => (row.admin_role ?? "super_admin") === "super_admin").length;
}

export async function updateAccountPriceMultiplier(id: string, priceMultiplier: number): Promise<void> {
  const { error } = await supabaseAdmin.from("accounts").update({ price_multiplier: priceMultiplier }).eq("id", id);
  if (error) throw new Error(`accounts: ${error.message}`);
}

/** `minOrderPairs: null` clears the override — the account falls back to the standard
 * `MIN_ORDER_PAIRS` again, same "unset means use the sitewide default" contract it started
 * with. */
export async function updateAccountMinOrderPairs(id: string, minOrderPairs: number | null): Promise<void> {
  const { error } = await supabaseAdmin.from("accounts").update({ min_order_pairs: minOrderPairs }).eq("id", id);
  if (error) throw new Error(`accounts: ${error.message}`);
}

export async function updateAccountCreditTerms(id: string, creditTerms: Account["creditTerms"]): Promise<void> {
  const { error } = await supabaseAdmin.from("accounts").update({ credit_terms: creditTerms }).eq("id", id);
  if (error) throw new Error(`accounts: ${error.message}`);
}

export async function updateAccountCreditLimit(id: string, creditLimit: number): Promise<void> {
  const { error } = await supabaseAdmin.from("accounts").update({ credit_limit: creditLimit }).eq("id", id);
  if (error) throw new Error(`accounts: ${error.message}`);
}

/** `repId: null` unassigns the account (falls back to the synthetic `UNASSIGNED_REP` on read). */
export async function updateAccountRep(id: string, repId: string | null): Promise<void> {
  const { error } = await supabaseAdmin.from("accounts").update({ rep_id: repId }).eq("id", id);
  if (error) throw new Error(`accounts: ${error.message}`);
}

export async function getAccountById(id: string): Promise<Account | undefined> {
  const { data, error } = await supabaseAdmin
    .from("accounts")
    .select("*, sales_reps(*)")
    .eq("id", id)
    .limit(1);
  if (error) throw new Error(`accounts: ${error.message}`);
  const row = data?.[0] as AccountRow | undefined;
  return row ? mapAccount(row) : undefined;
}

/** Provisions a brand-new buyer account (self-activation after an approved application). */
export async function createAccount(input: {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone?: string;
  password: string;
  status: Account["status"];
  creditTerms: Account["creditTerms"];
  creditLimit: number;
  resaleCertId: string;
  businessType: string;
  storeLocation: string;
  expectedVolume: string;
  appliedAt: string;
  approvedAt: string;
  shipTo: { label: string; line1: string; city: string; state: string; zip: string };
  /** The admin's decision from application review (see `approveApplicationWithAssignment`)
   * — `undefined`/`null` for `repId` means unassigned, matching the column's own default. */
  repId?: string | null;
  priceMultiplier?: number;
  /** The language this buyer is written to in (migration 0037). */
  locale?: string;
}): Promise<void> {
  const baseRow = {
    id: input.id,
    business_name: input.businessName,
    contact_name: input.contactName,
    email: input.email,
    password: input.password,
    status: input.status,
    credit_terms: input.creditTerms,
    credit_limit: input.creditLimit,
    resale_cert_id: input.resaleCertId,
    business_type: input.businessType,
    store_location: input.storeLocation,
    expected_volume: input.expectedVolume,
    applied_at: input.appliedAt,
    approved_at: input.approvedAt,
    rep_id: input.repId ?? null,
    price_multiplier: input.priceMultiplier ?? 1,
    role: "buyer",
  };

  // Same reasoning as order_lines.vat_rate: an INSERT naming a column that
  // doesn't exist yet errors outright (unlike a read, which just omits it),
  // so account creation — and therefore every application activation — must
  // not break for every buyer just because migration 0026 hasn't run.
  // `locale` (0037) is subject to the same rule as `phone` above — naming a column that
  // isn't there yet fails the whole insert — so it rides in the same optimistic attempt and
  // is dropped by the same fallback. A pre-0037 database still activates accounts; they
  // just take the column default once it exists.
  const { error } = await supabaseAdmin
    .from("accounts")
    .insert({ ...baseRow, phone: input.phone ?? null, ...(input.locale ? { locale: input.locale } : {}) });
  if (error) {
    const isMissingOptionalColumn =
      error.message.includes("schema cache") ||
      error.message.includes("Could not find") ||
      error.message.includes("phone") ||
      error.message.includes("locale");
    if (!isMissingOptionalColumn) throw new Error(`accounts: ${error.message}`);
    const { error: fallbackError } = await supabaseAdmin.from("accounts").insert(baseRow);
    if (fallbackError) throw new Error(`accounts: ${fallbackError.message}`);
  }

  const { error: shipToError } = await supabaseAdmin.from("ship_to_addresses").insert({
    id: toDbId(input.id, "ship-1"),
    account_id: input.id,
    label: input.shipTo.label,
    line1: input.shipTo.line1,
    city: input.shipTo.city,
    state: input.shipTo.state,
    zip: input.shipTo.zip,
    is_default: true,
  });
  if (shipToError) throw new Error(`ship_to_addresses: ${shipToError.message}`);
}

/** Buyer-editable identity fields — everything else (terms, credit limit, rep) is rep-managed. */
export async function updateAccountContact(
  id: string,
  input: { businessName: string; contactName: string; email: string; phone?: string },
): Promise<{ error?: string }> {
  const baseUpdate = { business_name: input.businessName, contact_name: input.contactName, email: input.email };
  const { error } = await supabaseAdmin
    .from("accounts")
    .update({ ...baseUpdate, phone: input.phone ?? null })
    .eq("id", id);
  if (error) {
    if (error.code === "23505") return { error: "That email is already in use by another account." };
    const isMissingPhoneColumn = error.message.includes("schema cache") || error.message.includes("Could not find") || error.message.includes("phone");
    if (!isMissingPhoneColumn) throw new Error(`accounts: ${error.message}`);
    // Pre-migration 0026 fallback — save what the schema actually supports rather than failing the whole save.
    const { error: fallbackError } = await supabaseAdmin.from("accounts").update(baseUpdate).eq("id", id);
    if (fallbackError) {
      if (fallbackError.code === "23505") return { error: "That email is already in use by another account." };
      throw new Error(`accounts: ${fallbackError.message}`);
    }
  }
  return {};
}

/** Admin-only phone edit/backfill for accounts that predate this feature or never went through the application flow. */
export async function updateAccountPhoneAdmin(id: string, phone: string): Promise<void> {
  const { error } = await supabaseAdmin.from("accounts").update({ phone: phone || null }).eq("id", id);
  if (error) throw new Error(`accounts: ${error.message}`);
}

export async function updateAccountPassword(id: string, newPassword: string): Promise<void> {
  const { error } = await supabaseAdmin.from("accounts").update({ password: newPassword }).eq("id", id);
  if (error) throw new Error(`accounts: ${error.message}`);
}

export async function insertShipToAddress(
  accountId: string,
  input: { label: string; line1: string; line2?: string; city: string; state: string; zip: string; isDefault: boolean },
): Promise<void> {
  const localId = `ship-${crypto.randomUUID().slice(0, 8)}`;
  if (input.isDefault) {
    const { error: clearError } = await supabaseAdmin
      .from("ship_to_addresses")
      .update({ is_default: false })
      .eq("account_id", accountId);
    if (clearError) throw new Error(`ship_to_addresses: ${clearError.message}`);
  }
  const { error } = await supabaseAdmin.from("ship_to_addresses").insert({
    id: toDbId(accountId, localId),
    account_id: accountId,
    label: input.label,
    line1: input.line1,
    line2: input.line2 || null,
    city: input.city,
    state: input.state,
    zip: input.zip,
    is_default: input.isDefault,
  });
  if (error) throw new Error(`ship_to_addresses: ${error.message}`);
}

export async function updateShipToAddress(
  accountId: string,
  localId: string,
  input: { label: string; line1: string; line2?: string; city: string; state: string; zip: string },
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("ship_to_addresses")
    .update({
      label: input.label,
      line1: input.line1,
      line2: input.line2 || null,
      city: input.city,
      state: input.state,
      zip: input.zip,
    })
    .eq("id", toDbId(accountId, localId))
    .eq("account_id", accountId);
  if (error) throw new Error(`ship_to_addresses: ${error.message}`);
}

export async function deleteShipToAddress(accountId: string, localId: string): Promise<void> {
  const { data: rows, error: fetchError } = await supabaseAdmin
    .from("ship_to_addresses")
    .select("id, is_default")
    .eq("account_id", accountId);
  if (fetchError) throw new Error(`ship_to_addresses: ${fetchError.message}`);

  const dbId = toDbId(accountId, localId);
  const remaining = (rows ?? []).filter((r) => r.id !== dbId);
  if (remaining.length === (rows ?? []).length) return; // already gone
  if (remaining.length === 0) return; // never delete the last ship-to address

  const wasDefault = (rows ?? []).find((r) => r.id === dbId)?.is_default;

  const { error } = await supabaseAdmin.from("ship_to_addresses").delete().eq("id", dbId).eq("account_id", accountId);
  if (error) throw new Error(`ship_to_addresses: ${error.message}`);

  if (wasDefault) {
    const { error: promoteError } = await supabaseAdmin
      .from("ship_to_addresses")
      .update({ is_default: true })
      .eq("id", remaining[0].id);
    if (promoteError) throw new Error(`ship_to_addresses: ${promoteError.message}`);
  }
}

export async function setDefaultShipToAddress(accountId: string, localId: string): Promise<void> {
  const { error: clearError } = await supabaseAdmin
    .from("ship_to_addresses")
    .update({ is_default: false })
    .eq("account_id", accountId);
  if (clearError) throw new Error(`ship_to_addresses: ${clearError.message}`);

  const { error } = await supabaseAdmin
    .from("ship_to_addresses")
    .update({ is_default: true })
    .eq("id", toDbId(accountId, localId))
    .eq("account_id", accountId);
  if (error) throw new Error(`ship_to_addresses: ${error.message}`);
}
