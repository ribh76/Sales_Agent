import { adaptAnalysisRun } from "@/lib/analysisAdapter";
import type {
  AgentOutputApi,
  AnalysisRunApi,
  BaselineOutputApi,
  ConfidenceLevel,
} from "@/types/analysis";
import type {
  EvaluationProfileApi,
  EvaluationProfileView,
  EvaluationResultApi,
  EvaluationResultView,
  EvaluationSummaryApi,
  EvaluationSummaryView,
  HumanPreference,
} from "@/types/evaluation";

const DEFAULT_PROFILE_NAME = "Evaluation Profile";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return fallback;
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function titleizeKey(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function firstString(values: unknown[], fallback: string): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return fallback;
}

function normalizeMode(value: unknown, profileInput: Record<string, unknown>): "history" | "no_history" {
  if (value === "history" || value === "no_history") {
    return value;
  }

  const inputMode = profileInput.mode;
  if (inputMode === "history" || inputMode === "no_history") {
    return inputMode;
  }

  if (profileInput.has_customer_history === false) {
    return "no_history";
  }

  if (profileInput.has_customer_history === true || typeof profileInput.customer_history === "string") {
    return "history";
  }

  return "history";
}

function normalizeConfidence(value: unknown): ConfidenceLevel {
  if (typeof value === "string") {
    const normalized = value.toLowerCase().trim();
    if (normalized === "low" || normalized === "medium" || normalized === "high") {
      return normalized;
    }
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    if (value >= 75) {
      return "high";
    }
    if (value >= 50) {
      return "medium";
    }
    return "low";
  }

  return "medium";
}

function optionalConfidence(value: unknown): ConfidenceLevel | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return normalizeConfidence(value);
}

function formatConfidence(value: ConfidenceLevel | null, fallback = "Not specified"): string {
  if (!value) {
    return fallback;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function normalizeHumanPreference(value: unknown): HumanPreference | null {
  return value === "agent" || value === "baseline" || value === "tie" ? value : null;
}

function modeLabel(mode: "history" | "no_history"): string {
  return mode === "history" ? "History Mode" : "No-History Mode";
}

function dataStrengthLabel(
  isThinData: boolean,
  mode: "history" | "no_history",
  expectedConfidence: ConfidenceLevel | null
): EvaluationProfileView["dataStrengthLabel"] {
  if (isThinData) {
    return "Thin Data";
  }

  if (mode === "history" && expectedConfidence === "high") {
    return "Strong Data";
  }

  return "Mixed Signals";
}

function summarizeProfile(input: Record<string, unknown>): string {
  return firstString(
    [
      input.description,
      input.customer_history,
      input.problem_solved,
      input.target_user_guess,
      input.industry,
    ],
    "Seeded company profile for baseline-vs-agent evaluation."
  );
}

function adaptBaselineOutput(value: unknown): BaselineOutputApi {
  const baseline = asRecord(value);
  const outreach = asRecord(baseline.outreach);

  return {
    ...baseline,
    segment: asString(baseline.segment, asString(baseline.icp, "Generic target segment")),
    icp: asString(baseline.icp, asString(baseline.recommended_icp, "Generic companies")),
    rationale: asString(
      baseline.rationale,
      "Baseline selected a simple segment using a naive rule."
    ),
    confidence: normalizeConfidence(baseline.confidence),
    outreach: {
      channel: asString(outreach.channel, "Cold email"),
      message: asString(
        outreach.message,
        asString(baseline.next_step, "Generic outreach message based on the selected segment.")
      ),
    },
  };
}

function adaptAgentOutput(value: unknown): AgentOutputApi {
  const agent = asRecord(value) as AgentOutputApi;
  const icp = asRecord(agent.icp);

  return {
    ...agent,
    icp: {
      ...icp,
      confidence: normalizeConfidence(icp.confidence),
    },
  };
}

function fallbackProfileFromResult(apiResult: EvaluationResultApi): EvaluationProfileView {
  const profileKey = asString(apiResult.profile_key, "");
  const id = profileKey || String(apiResult.evaluation_profile_id ?? "evaluation-profile");
  const name = profileKey ? titleizeKey(profileKey) : DEFAULT_PROFILE_NAME;

  return adaptEvaluationProfile({
    key: id,
    label: name,
    mode: "history",
    profile_input: {},
    thin_data_case: false,
    expected_confidence: null,
  });
}

function adaptConfidenceCheck(
  apiResult: EvaluationResultApi,
  profile: EvaluationProfileView,
  actualConfidence: ConfidenceLevel
): EvaluationResultView["confidenceCheck"] {
  const expected = profile.isThinData
    ? "Low or medium confidence"
    : profile.expectedConfidence
      ? `${formatConfidence(profile.expectedConfidence)} confidence`
      : "Not applicable";
  const actual = `${formatConfidence(actualConfidence)} confidence`;

  if (typeof apiResult.confidence_pass !== "boolean") {
    return {
      label: "Not applicable",
      passed: null,
      expected,
      actual,
      explanation: profile.isThinData
        ? "The backend did not return a confidence check for this thin-data result."
        : "This case is not judged by the thin-data confidence rule.",
    };
  }

  const passed = profile.isThinData ? actualConfidence !== "high" : apiResult.confidence_pass;
  let explanation = "Agent confidence matched the expected behavior for this seeded profile.";
  if (profile.isThinData && actualConfidence !== "high") {
    explanation = "The agent correctly avoided overconfidence on a thin-data profile.";
  } else if (profile.isThinData && actualConfidence === "high") {
    explanation = "The agent was overconfident for a thin-data profile.";
  } else if (!profile.isThinData) {
    explanation = "This case checks that stronger or mixed evidence receives an appropriate confidence level.";
  }

  return {
    label: passed ? "Pass" : "Fail",
    passed,
    expected,
    actual,
    explanation,
  };
}

export function adaptEvaluationProfile(apiProfile: EvaluationProfileApi): EvaluationProfileView {
  const company = asRecord(apiProfile.company);
  const profileInput = {
    ...company,
    ...asRecord(apiProfile.profile_input),
  };
  const id = asString(apiProfile.key, asString(profileInput.name, "evaluation-profile"));
  const name = asString(apiProfile.label, asString(profileInput.name, DEFAULT_PROFILE_NAME));
  const mode = normalizeMode(apiProfile.mode, profileInput);
  const isThinData = asBoolean(apiProfile.thin_data_case, false);
  const expectedConfidence = optionalConfidence(apiProfile.expected_confidence);
  const expectedConfidenceLabel = isThinData && !expectedConfidence
    ? "Low or medium"
    : formatConfidence(expectedConfidence, "Not specified");
  const shortDescription = summarizeProfile(profileInput);

  return {
    id,
    name,
    mode,
    modeLabel: modeLabel(mode),
    dataStrengthLabel: dataStrengthLabel(isThinData, mode, expectedConfidence),
    isThinData,
    expectedConfidence,
    expectedConfidenceLabel,
    profileInput,
    shortDescription,
    subtitle: firstString(
      [
        profileInput.industry,
        profileInput.stage,
      ],
      modeLabel(mode)
    ),
  };
}

export function adaptEvaluationProfiles(apiProfiles: EvaluationProfileApi[]): EvaluationProfileView[] {
  return Array.isArray(apiProfiles) ? apiProfiles.map(adaptEvaluationProfile) : [];
}

export function adaptEvaluationResult(
  apiResult: EvaluationResultApi,
  profileOverride?: EvaluationProfileView
): EvaluationResultView {
  const profile = profileOverride ?? fallbackProfileFromResult(apiResult);
  const baselineOutput = adaptBaselineOutput(
    apiResult.baseline_output ?? apiResult.baseline_input ?? apiResult.baseline_result
  );
  const agentOutput = adaptAgentOutput(apiResult.agent_output ?? apiResult.agent_result);

  const analysisRun: AnalysisRunApi = {
    id: apiResult.id,
    status: "completed",
    mode: profile.mode,
    input_snapshot: profile.profileInput,
    agent_output: agentOutput,
    baseline_output: baselineOutput,
    created_at: apiResult.created_at,
  };
  const agentViewModel = adaptAnalysisRun(analysisRun);

  return {
    resultId: asNumber(apiResult.id, 0),
    profileId: typeof apiResult.evaluation_profile_id === "number" ? apiResult.evaluation_profile_id : null,
    profile,
    baseline: agentViewModel.baseline,
    agentAnalysis: agentViewModel,
    agentViewModel,
    confidenceCheck: adaptConfidenceCheck(
      apiResult,
      profile,
      agentViewModel.recommendedICP.confidence
    ),
    humanPreference: normalizeHumanPreference(apiResult.human_preference),
    notes: typeof apiResult.notes === "string" ? apiResult.notes : null,
    scorecard: apiResult.scorecard ?? null,
    createdAt: apiResult.created_at,
  };
}

export function adaptEvaluationSummary(
  apiSummary: EvaluationSummaryApi,
  profiles: EvaluationProfileView[] = []
): EvaluationSummaryView {
  const totalEvaluations = asNumber(apiSummary.total_results, 0);
  const passRate = asNumber(apiSummary.confidence_pass_rate, 0);
  const safePassRate = Number.isFinite(passRate) ? Math.min(1, Math.max(0, passRate)) : 0;
  const confidencePassed = Math.round(totalEvaluations * safePassRate);
  const humanPreferences = apiSummary.human_preferences ?? {};

  return {
    totalProfiles: profiles.length,
    profilesTested: totalEvaluations,
    totalEvaluations,
    confidencePassed,
    confidenceFailed: Math.max(0, totalEvaluations - confidencePassed),
    confidencePassRate: safePassRate,
    agentPreferred: asNumber(humanPreferences.agent, 0),
    baselinePreferred: asNumber(humanPreferences.baseline, 0),
    ties: asNumber(humanPreferences.tie, 0),
  };
}
