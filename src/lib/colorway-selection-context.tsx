"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface ColorwaySelectionValue {
  colorwayId: string;
  setColorwayId: (id: string) => void;
}

const ColorwaySelectionContext = createContext<ColorwaySelectionValue | null>(null);

/** Shares the selected colorway between the product gallery and the purchase panel —
 * they sit in separate grid columns (server-rendered slots), so a click on a colorway
 * swatch in one needs to visibly update the other without lifting all the page's
 * server-rendered content into a single client component. */
export function ColorwaySelectionProvider({ initialColorwayId, children }: { initialColorwayId: string; children: ReactNode }) {
  const [colorwayId, setColorwayId] = useState(initialColorwayId);
  return <ColorwaySelectionContext.Provider value={{ colorwayId, setColorwayId }}>{children}</ColorwaySelectionContext.Provider>;
}

export function useColorwaySelection(): ColorwaySelectionValue {
  const ctx = useContext(ColorwaySelectionContext);
  if (!ctx) throw new Error("useColorwaySelection must be used within a ColorwaySelectionProvider");
  return ctx;
}
