import type { AnalysisResult } from "./analysis";
import type { CompanyInput } from "./company";

export type HumanPreference = "baseline" | "agent" | "tie";

export type EvaluationProfile = {
  key: string;
  label: string;
  company: CompanyInput;
  mode: "history" | "no_history";
  expected_confidence: "low" | "medium" | "high";
  thin_data_case: boolean;
};

export type EvaluationResult = {
  id: number;
  evaluation_profile_id: number;
  profile_key: string;
  baseline_input: {
    recommended_icp?: string;
    icp?: string;
    segment?: string;
    confidence?: string | number;
    rationale?: string;
    next_step?: string;
  };
  agent_output: AnalysisResult;
  confidence_pass: boolean;
  human_preference: HumanPreference | null;
  notes: string | null;
  baseline_result: {
    recommended_icp?: string;
    icp?: string;
    segment?: string;
    confidence?: string | number;
    rationale?: string;
    next_step?: string;
  };
  agent_result: AnalysisResult;
  scorecard: {
    baseline: Record<string, number>;
    agent: Record<string, number>;
    confidence_pass?: boolean;
    human_preference?: HumanPreference | null;
    summary: string;
  };
  created_at: string;
};

export type EvaluationSummaryData = {
  total_results: number;
  confidence_pass_rate: number | null;
  human_preferences: Record<HumanPreference, number>;
};
