import type { AnalysisResult } from "./analysis";
import type { CompanyInput } from "./company";

export type EvaluationProfile = {
  key: string;
  label: string;
  company: CompanyInput;
};

export type EvaluationResult = {
  id: number;
  profile_key: string;
  baseline_result: {
    recommended_icp: string;
    confidence: number;
    rationale: string;
    next_step: string;
  };
  agent_result: AnalysisResult;
  scorecard: {
    baseline: Record<string, number>;
    agent: Record<string, number>;
    summary: string;
  };
  created_at: string;
};

