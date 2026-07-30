import { Bodoni_Moda, Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";

// A high-contrast Didone serif (named for the Italian typographer) carries
// the headline register; Plus Jakarta Sans — a rounded, modern grotesk —
// keeps every other bit of copy across the site (labels, prices, colour
// names, buttons) reading as one consistent voice. Geist Mono is reserved
// for numeric/spec-sheet details (style numbers, quantities) by contrast.
export const displaySerif = Bodoni_Moda({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const bodySans = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: "variable",
});

export const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: "variable",
});
