import type { Company, CompanyInput } from "./company";

export type SegmentScore = {
  name: string;
  score: number;
  fit: number;
  urgency: number;
  reachability: number;
  deal_quality: number;
  evidence: string[];
};

export type OutreachVariation = {
  title: string;
  channel: string;
  message: string;
};

export type AnalysisResult = {
  diagnosis: string;
  recommended_icp: string;
  confidence: number;
  market_scores: SegmentScore[];
  disqualifiers: string[];
  external_benchmarks: string[];
  action_plan: string[];
  outreach: OutreachVariation[];
  human_checkpoint: string;
  assumptions: string[];
};

export type AnalysisRun = {
  id: number;
  company_id: number;
  status: string;
  input_snapshot: CompanyInput;
  result: AnalysisResult;
  model_name: string;
  created_at: string;
  completed_at?: string;
  company?: Company;
};

export type AnalysisCreatePayload = {
  company: CompanyInput;
};

export type FeedbackPayload = {
  run_id: number;
  rating: number;
  confidence: number;
  notes?: string;
};

