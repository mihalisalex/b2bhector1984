import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { fromDbId, toDbId, toNumber } from "@/lib/data/dbIds";
import type { Account, SalesRep } from "@/lib/types";

const UNASSIGNED_REP: SalesRep = {
  name: "New Accounts Team",
  title: "Wholesale Onboarding",
  email: "newaccounts@hector1984.com",
  phone: "(503) 555-0100",
  initials: "NA",
  territory: "Unassigned — a territory rep will follow up within 2 business days",
};

interface AccountRow {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  password: string;
  status: Account["status"];
  credit_terms: Account["creditTerms"];
  credit_limit: number | string;
  price_multiplier: number | string;
  resale_cert_id: string;
  business_type: string;
  store_location: string;
  expected_volume: string;
  applied_at: string;
  approved_at: string | null;
  role: Account["role"];
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
    password: row.password,
    status: row.status,
    creditTerms: row.credit_terms,
    creditLimit: toNumber(row.credit_limit),
    priceMultiplier: toNumber(row.price_multiplier),
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
  };
}

export async function getAccountByEmail(email: string): Promise<Account | undefined> {
  const { data, error } = await supabaseAdmin
    .from("accounts")
    .select("*, sales_reps(*)")
    .ilike("email", email)
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

export async function updateAccountPriceMultiplier(id: string, priceMultiplier: number): Promise<void> {
  const { error } = await supabaseAdmin.from("accounts").update({ price_multiplier: priceMultiplier }).eq("id", id);
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
}): Promise<void> {
  const { error } = await supabaseAdmin.from("accounts").insert({
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
    rep_id: null,
    role: "buyer",
  });
  if (error) throw new Error(`accounts: ${error.message}`);

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
  input: { businessName: string; contactName: string; email: string },
): Promise<{ error?: string }> {
  const { error } = await supabaseAdmin
    .from("accounts")
    .update({ business_name: input.businessName, contact_name: input.contactName, email: input.email })
    .eq("id", id);
  if (error) {
    if (error.code === "23505") return { error: "That email is already in use by another account." };
    throw new Error(`accounts: ${error.message}`);
  }
  return {};
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
