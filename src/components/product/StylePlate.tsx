import { cn } from "@/lib/cn";

/**
 * Editorial "plate" standing in for product photography: a colorway-tinted
 * panel with a shoe-profile silhouette, fine grain, and a spec-tag corner —
 * or a real photo, once one is uploaded via the admin dashboard.
 */
export function StylePlate({
  swatch,
  styleNumber,
  imageUrl,
  className,
  dense = false,
}: {
  swatch: [string, string?];
  styleNumber?: string;
  imageUrl?: string | null;
  className?: string;
  dense?: boolean;
}) {
  if (imageUrl) {
    return (
      <div className={cn("relative overflow-hidden bg-stone-200", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        {styleNumber && (
          <span className="font-mono-tab absolute bottom-2 right-2 bg-ink/80 px-1.5 py-0.5 text-[10px] tracking-wide text-white">
            {styleNumber}
          </span>
        )}
      </div>
    );
  }

  const [a, b] = swatch;
  return (
    <div
      className={cn("relative flex items-center justify-center overflow-hidden bg-stone-200", className)}
      style={{ background: `linear-gradient(155deg, ${a} 0%, ${b ?? a} 100%)` }}
    >
      {/* Fine grain for a tactile, considered surface rather than a flat gradient */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.35] mix-blend-overlay" aria-hidden>
        <filter id="plate-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#plate-grain)" />
      </svg>

      {/* Radial vignette for depth */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 100% at 50% 15%, transparent 40%, rgba(0,0,0,0.18) 100%)" }}
        aria-hidden
      />

      <svg
        className="absolute inset-0 h-full w-full opacity-[0.06]"
        aria-hidden
        preserveAspectRatio="none"
      >
        <pattern id="plate-grid" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M 28 0 L 0 0 0 28" fill="none" stroke="white" strokeWidth="1" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#plate-grid)" />
      </svg>

      {/* Corner registration ticks — reinforces the spec-sheet / technical motif */}
      {!dense && (
        <>
          <CornerTick className="left-3 top-3" />
          <CornerTick className="right-3 top-3 rotate-90" />
          <CornerTick className="bottom-3 left-3 -rotate-90" />
          <CornerTick className="bottom-3 right-3 rotate-180" />
        </>
      )}

      <svg
        viewBox="0 0 240 120"
        className={cn("relative w-[68%] drop-shadow-[0_8px_20px_rgba(0,0,0,0.18)]", dense ? "opacity-90" : "opacity-95")}
        aria-hidden
      >
        <path
          d="M12 88 C 10 74, 22 66, 34 64 C 48 62, 58 52, 72 44 C 92 32, 118 26, 142 28 C 158 29, 168 24, 182 22 C 200 20, 216 28, 224 40 C 230 49, 229 58, 222 64 L 222 82 C 222 90, 216 96, 206 96 L 34 96 C 20 96, 13 94, 12 88 Z"
          fill="white"
          fillOpacity="0.94"
        />
        <path
          d="M34 64 C 48 62, 58 52, 72 44 C 92 32, 118 26, 142 28 C 158 29, 168 24, 182 22"
          fill="none"
          stroke="black"
          strokeOpacity="0.15"
          strokeWidth="2"
        />
        <path d="M12 88 L222 88" fill="none" stroke="black" strokeOpacity="0.12" strokeWidth="2" />
        <circle cx="60" cy="58" r="2" fill="black" fillOpacity="0.2" />
        <circle cx="90" cy="46" r="2" fill="black" fillOpacity="0.2" />
        <circle cx="120" cy="38" r="2" fill="black" fillOpacity="0.2" />
      </svg>

      {styleNumber && (
        <span className="font-mono-tab absolute bottom-2 right-2 bg-ink/80 px-1.5 py-0.5 text-[10px] tracking-wide text-white">
          {styleNumber}
        </span>
      )}
    </div>
  );
}

function CornerTick({ className }: { className?: string }) {
  return (
    <svg
      className={cn("absolute h-3 w-3 text-white/40", className)}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
    >
      <path d="M0 4V0H4" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}
