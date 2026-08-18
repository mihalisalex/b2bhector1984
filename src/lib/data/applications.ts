import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Application, ApplicationStatus } from "@/lib/types";

interface ApplicationRow {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  resale_cert_id: string;
  business_type: string;
  store_location: string;
  address_line1: string;
  city: string;
  state: string;
  zip: string;
  expected_volume: string;
  website: string | null;
  status: ApplicationStatus;
  submitted_at: string;
  reviewed_at: string | null;
  rep_id: string | null;
  price_multiplier: number;
}

function mapApplication(row: ApplicationRow): Application {
  return {
    id: row.id,
    businessName: row.business_name,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    resaleCertId: row.resale_cert_id,
    businessType: row.business_type,
    storeLocation: row.store_location,
    addressLine1: row.address_line1,
    city: row.city,
    state: row.state,
    zip: row.zip,
    expectedVolume: row.expected_volume,
    website: row.website ?? undefined,
    status: row.status,
    submittedAt: row.submitted_at,
    repId: row.rep_id ?? undefined,
    // Same "missing migration" defensive default `friendlyDbError`'s pattern exists for
    // elsewhere in this codebase — reads on a database that hasn't run migration 0033 yet
    // just see everyone as unmultiplied, rather than every application list throwing.
    priceMultiplier: row.price_multiplier ?? 1,
  };
}

export async function insertApplication(
  // repId/priceMultiplier are an admin decision made at approval time, not something the
  // applicant provides or the DB needs at insert — both columns have sane defaults
  // (unassigned rep, 1x price) that apply automatically when omitted from the insert.
  data: Omit<Application, "id" | "status" | "submittedAt" | "repId" | "priceMultiplier">,
): Promise<string> {
  const { data: row, error } = await supabaseAdmin
    .from("applications")
    .insert({
      business_name: data.businessName,
      contact_name: data.contactName,
      email: data.email,
      phone: data.phone,
      resale_cert_id: data.resaleCertId,
      business_type: data.businessType,
      store_location: data.storeLocation,
      address_line1: data.addressLine1,
      city: data.city,
      state: data.state,
      zip: data.zip,
      expected_volume: data.expectedVolume,
      website: data.website ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(`applications: ${error.message}`);
  return row.id;
}

export async function getApplicationById(id: string): Promise<Application | undefined> {
  const { data, error } = await supabaseAdmin.from("applications").select("*").eq("id", id).limit(1);
  if (error) throw new Error(`applications: ${error.message}`);
  const row = data?.[0] as ApplicationRow | undefined;
  return row ? mapApplication(row) : undefined;
}

/**
 * Moves an application from one status to another, but only if it is still in the status
 * the caller expects. That guard stops two admins racing — one declines, a stale tab then
 * tries to approve the same row. Returns whether it actually changed.
 *
 * `from` used to be hard-coded to `"pending"`, which silently broke the last step of the
 * signup funnel: `activateAccount` calls this with `"active"` on a row that is already
 * `"approved"`, so the update matched zero rows and did nothing. Every buyer who had ever
 * activated still read as `"approved"` — the admin could not tell who had actually
 * onboarded, and the `"active"` state, though present in the check constraint and styled in
 * the UI, was unreachable. Making the expected status explicit keeps the race guard while
 * letting a legitimate second transition through.
 */
export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  from: ApplicationStatus = "pending",
): Promise<{ changed: boolean }> {
  const { data, error } = await supabaseAdmin
    .from("applications")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", from)
    .select("id");
  if (error) throw new Error(`applications: ${error.message}`);
  return { changed: (data?.length ?? 0) > 0 };
}

/**
 * Same "only transitions a still-pending row" guard as `updateApplicationStatus`, plus the
 * rep/multiplier decision the admin makes at the moment of approval — see
 * `AdminApplicationsList`. Kept as its own function (not an optional param on
 * `updateApplicationStatus`) because a decline never carries this decision; making it
 * unconditionally required here means a decline can't accidentally forget to pass it and a
 * caller reading this function's signature immediately knows it's approval-only.
 */
export async function approveApplicationWithAssignment(
  id: string,
  input: { repId: string | null; priceMultiplier: number },
): Promise<{ changed: boolean }> {
  const { data, error } = await supabaseAdmin
    .from("applications")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      rep_id: input.repId,
      price_multiplier: input.priceMultiplier,
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("id");
  if (error) throw new Error(`applications: ${error.message}`);
  return { changed: (data?.length ?? 0) > 0 };
}

export async function listApplications(status?: ApplicationStatus): Promise<Application[]> {
  let query = supabaseAdmin.from("applications").select("*").order("submitted_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(`applications: ${error.message}`);
  return (data ?? []).map(mapApplication);
}
