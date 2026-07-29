"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCatalog } from "@/lib/catalog-context";
import { getStyleImageUrl } from "@/lib/data/styleLabels";
import { getRecentlyViewed } from "@/lib/recentlyViewed";
import { StylePlate } from "@/components/product/StylePlate";

export function RecentlyViewedStrip({ excludeStyleId }: { excludeStyleId?: string }) {
  const { getStyleById } = useCatalog();
  const [ids, setIds] = useState<string[] | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a browser-only API (localStorage) at mount
    setIds(getRecentlyViewed());
  }, []);

  if (!ids) return null;
  const styles = ids.map((id) => getStyleById(id)).filter((s) => s && s.id !== excludeStyleId) as NonNullable<ReturnType<typeof getStyleById>>[];
  if (styles.length === 0) return null;

  return (
    <div>
      <h2 className="font-display mb-3 text-sm font-bold uppercase tracking-tight text-ink-soft">Recently Viewed</h2>
      <div className="scroll-thin flex gap-3 overflow-x-auto pb-1">
        {styles.slice(0, 8).map((style) => (
          <Link key={style.id} href={`/product/${style.slug}`} className="group w-28 shrink-0 sm:w-32">
            <StylePlate
              swatch={style.colorways[0].swatch}
              imageUrl={getStyleImageUrl(style)}
              alt={style.name}
              className="aspect-square w-full"
              dense
            />
            <p className="mt-1.5 truncate text-xs font-medium text-ink group-hover:underline">{style.name}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
