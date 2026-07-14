export type CompanyInput = {
  name: string;
  website?: string;
  industry: string;
  stage: string;
  average_contract_value?: number;
  has_customer_history: boolean;
  description: string;
  customer_history?: string;
};

export type Company = CompanyInput & {
  id: number;
  owner_id: number;
  created_at: string;
};

