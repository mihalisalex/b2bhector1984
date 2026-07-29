"use client";

import { useEffect } from "react";
import { pushRecentlyViewed } from "@/lib/recentlyViewed";

/** Invisible — records this product in the visitor's local recently-viewed list on mount. */
export function TrackRecentlyViewed({ styleId }: { styleId: string }) {
  useEffect(() => {
    pushRecentlyViewed(styleId);
  }, [styleId]);
  return null;
}
