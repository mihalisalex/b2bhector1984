/**
 * Real shops that stock Hector, shown on the homepage to first-time visitors.
 *
 * Deliberately empty until the owner supplies real ones (name, town, and ideally a photo of
 * the shoes in their shop) with each shop's permission — an invented stockist or quote on a
 * B2B site is exactly the thing a buyer checks, and the section stays hidden while this is
 * empty. `imageUrl` may point at a Supabase Storage public URL or /public.
 */
export interface Stockist {
  name: string;
  town: string;
  /** ISO country code, e.g. "GR". */
  country: string;
  imageUrl?: string;
}

export const STOCKISTS: Stockist[] = [];
