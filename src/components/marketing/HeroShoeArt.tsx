import { cn } from "@/lib/cn";

/**
 * Editorial greyscale hero illustration — a men's trainer rendered as a
 * moody, halftone-and-grain "photograph" rather than the flat colorway
 * plates used in the catalog. Placeholder art until a real hero shoot
 * replaces it.
 */
export function HeroShoeArt({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-[#101215]", className)}>
      <svg viewBox="0 0 480 300" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="hero-bg" cx="35%" cy="30%" r="85%">
            <stop offset="0%" stopColor="#33373d" />
            <stop offset="55%" stopColor="#191c20" />
            <stop offset="100%" stopColor="#0a0b0d" />
          </radialGradient>
          <linearGradient id="hero-upper" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f2f1ee" />
            <stop offset="45%" stopColor="#cbc9c5" />
            <stop offset="100%" stopColor="#83817e" />
          </linearGradient>
          <linearGradient id="hero-sole" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3a3b3d" />
            <stop offset="100%" stopColor="#131415" />
          </linearGradient>
          <radialGradient id="hero-ground" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="hero-vignette" cx="50%" cy="45%" r="75%">
            <stop offset="55%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.65" />
          </radialGradient>
          <pattern id="hero-halftone" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1.1" cy="1.1" r="1.1" fill="#ffffff" />
          </pattern>
          <filter id="hero-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>

        {/* Base studio-light backdrop */}
        <rect width="480" height="300" fill="url(#hero-bg)" />

        {/* Ground shadow the shoe "sits" in */}
        <ellipse cx="255" cy="248" rx="190" ry="26" fill="url(#hero-ground)" />

        {/* Sole / outsole, drawn first so the upper overlaps its top edge */}
        <path
          d="M75 233 C70 246 80 254 100 256 L410 256 C428 254 436 246 432 233 L410.8 224.8 L101.2 224.8 Z"
          fill="url(#hero-sole)"
        />
        {/* Tread ticks */}
        <g stroke="#000000" strokeOpacity="0.4" strokeWidth="1.5">
          {Array.from({ length: 13 }).map((_, i) => {
            const x = 95 + i * 26;
            return <line key={i} x1={x} y1="248" x2={x} y2="255" />;
          })}
        </g>

        {/* Upper body */}
        <path
          d="M61.6 218.4
             C 58 193.2, 79.6 178.8, 101.2 175.2
             C 126.4 171.6, 144.4 153.6, 169.6 139.2
             C 205.6 117.6, 252.4 106.8, 295.6 110.4
             C 324.4 112.2, 342.4 103.2, 367.6 99.6
             C 400 96, 428.8 110.4, 443.2 132
             C 454 148.2, 452.2 164.4, 439.6 175.2
             L 439.6 207.6
             C 439.6 222, 428.8 232.8, 410.8 232.8
             L 101.2 232.8
             C 76 232.8, 63.4 229.2, 61.6 218.4
             Z"
          fill="url(#hero-upper)"
        />

        {/* Toe cap seam */}
        <path
          d="M372 103 C 392 112, 408 126, 412 144"
          fill="none"
          stroke="#000000"
          strokeOpacity="0.22"
          strokeWidth="2"
        />
        {/* Quarter panel seam */}
        <path
          d="M150 168 C 170 158, 188 146, 205 132"
          fill="none"
          stroke="#000000"
          strokeOpacity="0.18"
          strokeWidth="2"
        />

        {/* Heel pull tab */}
        <path
          d="M78 178 C 74 172, 78 164, 88 163 C 98 162, 103 169, 100 177 C 97 184, 82 185, 78 178 Z"
          fill="#9a9895"
          stroke="#000000"
          strokeOpacity="0.25"
          strokeWidth="1.5"
        />

        {/* Lace eyelets + crossed laces */}
        <g>
          <path
            d="M198 121 L232 132 L222 108 L258 122 L246 100 L282 116"
            fill="none"
            stroke="#2a2a2a"
            strokeOpacity="0.55"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {[
            [198, 121],
            [232, 132],
            [222, 108],
            [258, 122],
            [246, 100],
            [282, 116],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="3.2" fill="#1c1c1c" stroke="#efeeec" strokeOpacity="0.5" strokeWidth="0.75" />
          ))}
        </g>

        {/* Halftone + grain texture for an artistic, printed feel */}
        <rect width="480" height="300" fill="url(#hero-halftone)" opacity="0.05" />
        <rect width="480" height="300" filter="url(#hero-grain)" opacity="0.05" style={{ mixBlendMode: "overlay" }} />

        {/* Vignette to seat the shoe in the frame */}
        <rect width="480" height="300" fill="url(#hero-vignette)" />
      </svg>

      <span className="font-mono-tab absolute bottom-3 right-3 border border-white/15 bg-black/40 px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-white/70 backdrop-blur-sm">
        HR-1001 &middot; Meridian
      </span>
    </div>
  );
}
