import type { Company, CompanyInput } from "./company";

export type CompanyMode = "history" | "no_history";

export type ConfidenceLevel = "low" | "medium" | "high";

export type SegmentScores = {
  size: number;
  access: number;
  ticket: number;
  cycle: number;
  competition: number;
};

export type MarketSegment = {
  name: string;
  scores: SegmentScores;
  total: number;
  rationale: string;
};

export type ICPOutput = {
  profile: string;
  company_size: string;
  target_industry: string;
  region: string;
  decision_maker: string;
  main_pain: string;
  rationale: string;
  confidence: ConfidenceLevel;
  confidence_basis: string;
};

export type OutreachOutput = {
  channel: string;
  trigger: string;
  first_contact: string;
  message_tone: string;
  sample_message: string;
  confidence: ConfidenceLevel;
  confidence_basis: string;
};

export type AgentOutput = {
  diagnosis: string;
  external_benchmarks: {
    stat: string;
    source: string;
  }[];
  markets: MarketSegment[];
  icp: ICPOutput;
  approach: OutreachOutput;
  hypotheses_to_validate: string[];
  questions_for_human: string[];
};

export type BaselineOutput = {
  segment: string;
  icp: string;
  rationale: string;
  confidence: ConfidenceLevel;
  outreach: {
    channel: string;
    message: string;
  };
  recommended_icp?: string;
  next_step?: string;
};

export type ActionPlanStep = {
  title: string;
  owner?: string;
  timeframe?: string;
  success_metric?: string;
};

export type ActionPlanOutput =
  | {
      summary?: string;
      next_steps: ActionPlanStep[];
      risks?: string[];
    }
  | string[];

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
  status: "pending" | "completed" | "failed";
  mode: CompanyMode;
  agent_output: AgentOutput | AnalysisResult;
  baseline_output: BaselineOutput;
  action_plan?: ActionPlanOutput;
  created_at: string;

  // Compatibility fields returned by the current FastAPI response.
  input_snapshot: CompanyInput;
  result: AnalysisResult;
  model_name: string;
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
