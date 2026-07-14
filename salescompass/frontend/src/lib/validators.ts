import type { CompanyInput } from "@/types/company";

export function validateCompanyInput(input: CompanyInput): string | null {
  if (input.name.trim().length < 2) {
    return "Company name is required.";
  }
  if (input.industry.trim().length < 2) {
    return "Industry is required.";
  }
  if (input.stage.trim().length < 2) {
    return "Stage is required.";
  }
  if (input.description.trim().length < 20) {
    return "Description needs at least 20 characters.";
  }
  if (input.has_customer_history && !input.customer_history?.trim()) {
    return "Customer history is required for this mode.";
  }
  return null;
}

