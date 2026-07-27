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
  };
}

export async function insertApplication(
  data: Omit<Application, "id" | "status" | "submittedAt">,
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

export async function updateApplicationStatus(id: string, status: ApplicationStatus): Promise<void> {
  const { error } = await supabaseAdmin
    .from("applications")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`applications: ${error.message}`);
}

export async function listApplications(status?: ApplicationStatus): Promise<Application[]> {
  let query = supabaseAdmin.from("applications").select("*").order("submitted_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(`applications: ${error.message}`);
  return (data ?? []).map(mapApplication);
}
