import type { SavedAssortment } from "@/lib/types";

export const ASSORTMENTS: Record<string, SavedAssortment[]> = {
  "acct-001": [
    {
      id: "asrt-1",
      name: "Fall Reorder Wall",
      createdAt: "2026-06-15",
      styleIds: ["st-01", "st-07", "st-02"],
    },
    {
      id: "asrt-2",
      name: "New Door Opener Kit",
      createdAt: "2026-07-01",
      styleIds: ["st-06", "st-10", "st-09"],
    },
  ],
  "acct-002": [
    {
      id: "asrt-1",
      name: "Flagship Store Reset",
      createdAt: "2026-05-20",
      styleIds: ["st-11", "st-07", "st-12", "st-01"],
    },
  ],
  "acct-003": [],
};

export function getAssortmentsForAccount(accountId: string): SavedAssortment[] {
  return ASSORTMENTS[accountId] ?? [];
}
