import type { PricingTier } from "@/lib/types";

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "standard",
    label: "Standard",
    description: "Entry wholesale tier for newly approved accounts.",
    priceMultiplier: 1,
    moqMultiplier: 1,
    discountBadge: "List wholesale",
  },
  {
    id: "preferred",
    label: "Preferred",
    description: "Unlocked after $25K in trailing-12-month volume.",
    priceMultiplier: 0.93,
    moqMultiplier: 0.85,
    discountBadge: "7% under list",
  },
  {
    id: "vip",
    label: "VIP",
    description: "Strategic accounts and door-count commitments.",
    priceMultiplier: 0.86,
    moqMultiplier: 0.7,
    discountBadge: "14% under list",
  },
];

export function getTier(id: string): PricingTier {
  const tier = PRICING_TIERS.find((t) => t.id === id);
  if (!tier) throw new Error(`Unknown pricing tier: ${id}`);
  return tier;
}
