import type {
  AgentOutputApi,
  AnalysisViewModel,
  BaselineOutputApi,
  BaselineView,
  ConfidenceLevel,
} from "./analysis";
import type { CompanyInput } from "./company";

export type HumanPreference = "baseline" | "agent" | "tie";

export type ConfidenceCheckView = {
  label: "Pass" | "Fail" | "Not applicable";
  passed: boolean | null;
  expected: string;
  actual: string;
  explanation: string;
};

export type EvaluationScorecardApi = {
  baseline?: Record<string, number>;
  agent?: Record<string, number>;
  confidence_pass?: boolean;
  human_preference?: HumanPreference | null;
  summary?: string | null;
};

// Raw backend API types from /evaluation/*.
export type EvaluationProfileApi = {
  key?: string;
  label?: string;
  company?: CompanyInput;
  mode?: "history" | "no_history" | string;
  profile_input?: Record<string, unknown>;
  expected_confidence?: ConfidenceLevel | string | null;
  thin_data_case?: boolean | null;
  [key: string]: unknown;
};

export type EvaluationResultApi = {
  id?: number;
  evaluation_profile_id?: number;
  profile_key?: string | null;
  baseline_input?: BaselineOutputApi | null;
  baseline_output?: BaselineOutputApi | null;
  baseline_result?: BaselineOutputApi | null;
  agent_output?: AgentOutputApi | null;
  agent_result?: AgentOutputApi | null;
  confidence_pass?: boolean | null;
  human_preference?: HumanPreference | string | null;
  notes?: string | null;
  created_at?: string;
  scorecard?: EvaluationScorecardApi | null;
  [key: string]: unknown;
};

export type EvaluationSummaryApi = {
  total_results?: number;
  confidence_pass_rate?: number | null;
  human_preferences?: Partial<Record<HumanPreference, number>>;
  [key: string]: unknown;
};

export type EvaluationProfileView = {
  id: string;
  name: string;
  mode: "history" | "no_history";
  modeLabel: string;
  dataStrengthLabel: "Strong Data" | "Thin Data" | "Mixed Signals";
  isThinData: boolean;
  expectedConfidence: ConfidenceLevel | null;
  expectedConfidenceLabel: string;
  profileInput: Record<string, unknown>;
  shortDescription: string;
  subtitle: string;
};

export type EvaluationResultView = {
  resultId: number;
  profileId: number | null;
  profile: EvaluationProfileView;
  baseline: BaselineView;
  agentAnalysis: AnalysisViewModel;
  agentViewModel: AnalysisViewModel;
  confidenceCheck: ConfidenceCheckView;
  humanPreference: HumanPreference | null;
  notes: string | null;
  scorecard: EvaluationScorecardApi | null;
  createdAt?: string;
};

export type EvaluationSummaryView = {
  totalProfiles: number;
  profilesTested: number;
  totalEvaluations: number;
  confidencePassed: number;
  confidenceFailed: number;
  confidencePassRate: number;
  agentPreferred: number;
  baselinePreferred: number;
  ties: number;
};
