"use client";

import { useEffect } from "react";
import { pushRecentlyViewed } from "@/lib/recentlyViewed";
import { recordStyleViewAction } from "@/lib/analyticsActions";

/** Invisible — records this product in the visitor's local recently-viewed list on mount,
 * and counts the view for the admin analytics (see recordStyleViewAction). */
export function TrackRecentlyViewed({ styleId }: { styleId: string }) {
  useEffect(() => {
    pushRecentlyViewed(styleId);
    void recordStyleViewAction(styleId);
  }, [styleId]);
  return null;
}
