import { Bodoni_Moda, Geist, Geist_Mono } from "next/font/google";

// A high-contrast Didone serif (named for the Italian typographer) carries
// the headline register; Geist (sans + mono) keeps body copy and
// spec-sheet/numeric details reading contemporary by contrast.
export const displaySerif = Bodoni_Moda({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const bodySans = Geist({
  variable: "--font-body",
  subsets: ["latin"],
  weight: "variable",
});

export const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: "variable",
});
