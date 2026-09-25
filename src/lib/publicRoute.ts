import { AUDIENCES } from "@/lib/audience";

/**
 * Adds `audience: "public"` to a route's params. Used only by the thin wrappers under
 * `src/app/[lang]/public/` — see that folder's layout for why they exist.
 */
export function asPublic<T extends object>(params: Promise<T>): Promise<T & { audience: typeof AUDIENCES.public }> {
  return params.then((p) => ({ ...p, audience: AUDIENCES.public }));
}
