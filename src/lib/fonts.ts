import { Bodoni_Moda, IBM_Plex_Mono, Inter } from "next/font/google";

// A high-contrast Didone serif (named for the Italian typographer) carries
// the "Italian luxury" register on headlines; IBM Plex Mono keeps the
// spec-sheet/numeric details reading precise and modern by contrast.
export const displaySerif = Bodoni_Moda({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
