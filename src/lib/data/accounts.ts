import type { Account } from "@/lib/types";

export const ACCOUNTS: Account[] = [
  {
    id: "acct-001",
    businessName: "Union Supply Co.",
    contactName: "Dana Ferris",
    email: "buyer@unionsupply.com",
    password: "wholesale84",
    tier: "preferred",
    status: "active",
    creditTerms: "net30",
    creditLimit: 45000,
    resaleCertId: "OR-RS-88214",
    businessType: "Multi-brand run specialty (2 doors)",
    storeLocation: "Portland, OR",
    expectedVolume: "$40,000–$75,000 / year",
    appliedAt: "2025-11-03",
    approvedAt: "2025-11-06",
    shipTo: [
      {
        id: "ship-1",
        label: "Union Supply — Hawthorne",
        line1: "4110 SE Hawthorne Blvd",
        city: "Portland",
        state: "OR",
        zip: "97214",
        isDefault: true,
      },
      {
        id: "ship-2",
        label: "Union Supply — Distribution Annex",
        line1: "8800 NE Alderwood Rd, Suite C",
        city: "Portland",
        state: "OR",
        zip: "97220",
      },
    ],
    rep: {
      name: "Marcus Iyer",
      title: "Territory Sales Manager, Pacific NW",
      email: "marcus.iyer@hector1984.com",
      phone: "(503) 555-0148",
      initials: "MI",
      territory: "WA / OR / ID",
    },
  },
  {
    id: "acct-002",
    businessName: "Fieldhouse Athletics",
    contactName: "Priya Nandakumar",
    email: "buyer@fieldhouseath.com",
    password: "wholesale84",
    tier: "vip",
    status: "active",
    creditTerms: "net60",
    creditLimit: 120000,
    resaleCertId: "IL-RS-40217",
    businessType: "Regional chain (6 doors)",
    storeLocation: "Chicago, IL",
    expectedVolume: "$150,000+ / year",
    appliedAt: "2024-02-11",
    approvedAt: "2024-02-14",
    shipTo: [
      {
        id: "ship-1",
        label: "Fieldhouse — DC Chicago",
        line1: "2200 S Ashland Ave",
        city: "Chicago",
        state: "IL",
        zip: "60608",
        isDefault: true,
      },
    ],
    rep: {
      name: "Renata Souza",
      title: "Key Account Director",
      email: "renata.souza@hector1984.com",
      phone: "(312) 555-0193",
      initials: "RS",
      territory: "National Accounts",
    },
  },
  {
    id: "acct-003",
    businessName: "Trailhead Mercantile",
    contactName: "Owen Bright",
    email: "buyer@trailheadmerc.com",
    password: "wholesale84",
    tier: "standard",
    status: "active",
    creditTerms: "prepay",
    creditLimit: 8000,
    resaleCertId: "CO-RS-11209",
    businessType: "Independent outdoor specialty (1 door)",
    storeLocation: "Bend, OR",
    expectedVolume: "$10,000–$25,000 / year",
    appliedAt: "2026-05-19",
    approvedAt: "2026-05-24",
    shipTo: [
      {
        id: "ship-1",
        label: "Trailhead Mercantile",
        line1: "119 NW Newport Ave",
        city: "Bend",
        state: "OR",
        zip: "97703",
        isDefault: true,
      },
    ],
    rep: {
      name: "Marcus Iyer",
      title: "Territory Sales Manager, Pacific NW",
      email: "marcus.iyer@hector1984.com",
      phone: "(503) 555-0148",
      initials: "MI",
      territory: "WA / OR / ID",
    },
  },
];

export function getAccountByEmail(email: string): Account | undefined {
  return ACCOUNTS.find((a) => a.email.toLowerCase() === email.toLowerCase());
}

export function getAccountById(id: string): Account | undefined {
  return ACCOUNTS.find((a) => a.id === id);
}
