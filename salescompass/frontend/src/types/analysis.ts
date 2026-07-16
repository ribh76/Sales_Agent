import type { Company } from "./company";

export type CompanyMode = "history" | "no_history";

export type ConfidenceLevel = "low" | "medium" | "high";

export type AnalysisStatus = "pending" | "completed" | "failed";

export type ReviewStatus = "needs_review" | "approved";

// Raw backend API types. Keep these aligned to JSON from /analyses.
export type SegmentScoresApi = {
  size?: number;
  access?: number;
  ticket?: number;
  cycle?: number;
  competition?: number;
};

export type MarketSegmentApi = {
  name?: string;
  scores?: SegmentScoresApi;
  total?: number | null;
  rationale?: string;
  [key: string]: unknown;
};

export type ICPOutputApi = {
  profile?: string;
  company_size?: string;
  target_industry?: string;
  region?: string;
  decision_maker?: string;
  main_pain?: string;
  rationale?: string;
  confidence?: ConfidenceLevel | string;
  confidence_basis?: string;
  [key: string]: unknown;
};

export type OutreachOutputApi = {
  channel?: string;
  trigger?: string;
  first_contact?: string;
  message_tone?: string;
  sample_message?: string;
  confidence?: ConfidenceLevel | string;
  confidence_basis?: string;
  [key: string]: unknown;
};

export type BenchmarkApi = unknown;

export type AgentOutputApi = {
  diagnosis?: string;
  external_benchmarks?: BenchmarkApi[];
  markets?: MarketSegmentApi[];
  icp?: ICPOutputApi;
  approach?: OutreachOutputApi;
  hypotheses_to_validate?: string[];
  questions_for_human?: string[];
};

export type BaselineOutputApi = {
  segment?: string;
  icp?: string;
  rationale?: string;
  confidence?: ConfidenceLevel | string | number;
  outreach?: {
    channel?: string;
    message?: string;
  };
  [key: string]: unknown;
};

export type ActionPlanApi = Record<string, unknown> | unknown[];

export type AnalysisRunApi = {
  id?: number;
  run_id?: number;
  user_id?: number;
  company_id?: number;
  status?: AnalysisStatus | string;
  mode?: CompanyMode | string;
  input_snapshot?: Record<string, unknown>;
  agent_output?: AgentOutputApi;
  baseline_output?: BaselineOutputApi;
  action_plan?: ActionPlanApi | null;
  review_status?: ReviewStatus | string;
  refinement_notes?: string | null;
  error_message?: string | null;
  model_name?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
  company?: Company | null;
};

// Frontend view-model types. These are normalized for rendering only.
export type SegmentScoresView = {
  size: number;
  access: number;
  ticket: number;
  cycle: number;
  competition: number;
};

export type MarketSegmentView = {
  name: string;
  total: number;
  rationale: string;
  scores: SegmentScoresView;
};

export type RecommendedICPView = {
  profile: string;
  industry: string;
  companySize: string;
  region: string;
  decisionMaker: string;
  painPoint: string;
  rationale: string;
  confidence: ConfidenceLevel;
  confidenceBasis: string;
};

export type OutreachView = {
  channel: string;
  trigger: string;
  firstContact: string;
  tone: string;
  sampleMessage: string;
  confidence: ConfidenceLevel;
  confidenceBasis: string;
};

export type BenchmarkView = {
  stat: string;
  source: string;
};

export type BaselineView = {
  segment: string;
  icp: string;
  rationale: string;
  confidence: ConfidenceLevel;
  outreachChannel: string;
  outreachMessage: string;
};

export type EvidenceItemView = {
  label: string;
  value: string;
};

export type DowngradedSegmentView = {
  name: string;
  score: number;
  rationale: string;
};

export type ModeEvidenceView = {
  salesHistory: EvidenceItemView[];
  wonLostPatterns: EvidenceItemView[];
  conversionEvidence: EvidenceItemView[];
  downgradedSegments: DowngradedSegmentView[];
  marketAssumptions: EvidenceItemView[];
  demoMarketContext: EvidenceItemView[];
};

export type ActionPlanStepView = {
  title: string;
  owner?: string;
  timeframe?: string;
  successMetric?: string;
};

export type ActionMessageVariationView = {
  title: string;
  channel: string;
  message: string;
};

export type ActionPlanView = {
  summary?: string;
  nextSteps: ActionPlanStepView[];
  messageVariations: ActionMessageVariationView[];
  metricsToTrack: string[];
};

export type AnalysisViewModel = {
  runId: number;
  companyId?: number;
  companyName?: string;
  status: AnalysisStatus;
  mode: CompanyMode;
  createdAt?: string;

  diagnosis: string;
  benchmarks: BenchmarkView[];
  markets: MarketSegmentView[];
  recommendedICP: RecommendedICPView;
  outreach: OutreachView;
  hypothesesToValidate: string[];
  questionsForHuman: string[];
  baseline: BaselineView;
  modeEvidence: ModeEvidenceView;
  actionPlan?: ActionPlanView;
  reviewStatus: ReviewStatus;
  errorMessage?: string | null;
};
