"use server";

import { getCurrentAccount } from "@/lib/session";
import { recordStyleView } from "@/lib/data/styleAnalytics";

/**
 * Records one product-page view. Called from the browser (TrackRecentlyViewed) because the
 * product page itself is now a cached page for logged-out visitors: a server-side insert
 * during render would only have run once per regeneration, not once per view.
 *
 * Best-effort like `recordStyleView`: an unknown id fails the style_views foreign key and is
 * logged, never thrown. The account, if any, comes from the session — never from the caller.
 */
export async function recordStyleViewAction(styleId: unknown): Promise<void> {
  if (typeof styleId !== "string" || styleId.length === 0 || styleId.length > 64) return;
  const account = await getCurrentAccount();
  await recordStyleView(styleId, account?.id ?? null);
}
