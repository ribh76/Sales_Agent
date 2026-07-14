import type { CompanyInput } from "@/types/company";

export const demoProfiles: Array<{ key: string; label: string; company: CompanyInput }> = [
  {
    key: "northstar-enablement",
    label: "Northstar Enablement",
    company: {
      name: "Northstar Enablement",
      website: "https://northstar.example",
      industry: "B2B SaaS",
      stage: "Series A",
      average_contract_value: 18000,
      has_customer_history: true,
      description:
        "Sales enablement software that helps revenue teams onboard reps faster and standardize pipeline coaching.",
      customer_history:
        "Best customers are 80-300 employee SaaS companies with new sales managers and ramp-time pain."
    }
  },
  {
    key: "ledgerloop",
    label: "LedgerLoop",
    company: {
      name: "LedgerLoop",
      website: "https://ledgerloop.example",
      industry: "Fintech",
      stage: "Seed",
      average_contract_value: 9000,
      has_customer_history: false,
      description:
        "Workflow automation for finance teams that reconcile vendor payments and month-end close."
    }
  }
];

