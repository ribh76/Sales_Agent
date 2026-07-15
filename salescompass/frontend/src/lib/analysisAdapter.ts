import type {
  ActionPlanApi,
  ActionPlanView,
  AnalysisRunApi,
  AnalysisStatus,
  AnalysisViewModel,
  BaselineOutputApi,
  BaselineView,
  BenchmarkApi,
  BenchmarkView,
  CompanyMode,
  ConfidenceLevel,
  ICPOutputApi,
  MarketSegmentApi,
  MarketSegmentView,
  OutreachOutputApi,
  OutreachView,
  RecommendedICPView,
  SegmentScoresView,
} from "@/types/analysis";

const DEFAULT_CONFIDENCE: ConfidenceLevel = "medium";

function asString(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim().length > 0) {
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

function clampScore(value: unknown, fallback = 5): number {
  const score = asNumber(value, fallback);
  return Math.min(10, Math.max(1, Math.round(score)));
}

function normalizeConfidence(value: unknown): ConfidenceLevel {
  if (typeof value !== "string") {
    return DEFAULT_CONFIDENCE;
  }

  const normalized = value.toLowerCase().trim();

  if (normalized === "low" || normalized === "medium" || normalized === "high") {
    return normalized;
  }

  return DEFAULT_CONFIDENCE;
}

function normalizeStatus(value: unknown): AnalysisStatus {
  if (value === "pending" || value === "completed" || value === "failed") {
    return value;
  }

  return "completed";
}

function normalizeMode(value: unknown): CompanyMode {
  if (value === "history" || value === "no_history") {
    return value;
  }

  return "history";
}

function normalizeList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      if (item && typeof item === "object" && "title" in item) {
        return (item as { title?: unknown }).title;
      }

      return undefined;
    })
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function recordValue(value: unknown, key: string): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return (value as Record<string, unknown>)[key];
}

function adaptScores(scores: MarketSegmentApi["scores"]): SegmentScoresView {
  return {
    size: clampScore(scores?.size, 5),
    access: clampScore(scores?.access, 5),
    ticket: clampScore(scores?.ticket, 5),
    cycle: clampScore(scores?.cycle, 5),
    competition: clampScore(scores?.competition, 5),
  };
}

function calculateTotal(scores: SegmentScoresView): number {
  return Math.round(
    (scores.size + scores.access + scores.ticket + scores.cycle + scores.competition) / 5
  );
}

function adaptMarket(market: MarketSegmentApi, index: number): MarketSegmentView {
  const scores = adaptScores(market.scores);
  const calculatedTotal = calculateTotal(scores);

  return {
    name: asString(market.name, `Candidate Segment ${index + 1}`),
    total: clampScore(market.total, calculatedTotal),
    rationale: asString(
      market.rationale,
      "This segment appears relevant based on the submitted company profile."
    ),
    scores,
  };
}

function adaptBenchmarks(benchmarks?: BenchmarkApi[]): BenchmarkView[] {
  if (!Array.isArray(benchmarks)) {
    return [];
  }

  return benchmarks.map((benchmark) => {
    if (typeof benchmark === "string") {
      return {
        stat: asString(benchmark, "Market context unavailable"),
        source: "Demo/context source",
      };
    }

    return {
      stat: asString(recordValue(benchmark, "stat"), "Market context unavailable"),
      source: asString(recordValue(benchmark, "source"), "Demo/context source"),
    };
  });
}

function adaptICP(icp?: ICPOutputApi): RecommendedICPView {
  return {
    profile: asString(icp?.profile, "Focused B2B customer segment"),
    industry: asString(icp?.target_industry, "Target industry not specified"),
    companySize: asString(icp?.company_size, "Company size not specified"),
    region: asString(icp?.region, "Region not specified"),
    decisionMaker: asString(icp?.decision_maker, "Relevant business decision-maker"),
    painPoint: asString(icp?.main_pain, "Pain point not specified"),
    rationale: asString(
      icp?.rationale,
      "The recommendation is based on the company profile, available signals, and segment scoring."
    ),
    confidence: normalizeConfidence(icp?.confidence),
    confidenceBasis: asString(
      icp?.confidence_basis,
      "Confidence is based on the amount and quality of available company data."
    ),
  };
}

function adaptOutreach(approach?: OutreachOutputApi): OutreachView {
  return {
    channel: asString(approach?.channel, "Cold email"),
    trigger: asString(approach?.trigger, "Recent operational or growth-related pain"),
    firstContact: asString(approach?.first_contact, "Relevant decision-maker"),
    tone: asString(approach?.message_tone, "Consultative and specific"),
    sampleMessage: asString(
      approach?.sample_message,
      "Hi - based on your current priorities, I thought this might be relevant. We help companies like yours solve a similar operational challenge and would be happy to share a quick example."
    ),
    confidence: normalizeConfidence(approach?.confidence),
    confidenceBasis: asString(
      approach?.confidence_basis,
      "Outreach confidence is based on fit, clarity of pain, and accessibility of the buyer."
    ),
  };
}

function adaptBaseline(baseline?: BaselineOutputApi): BaselineView {
  return {
    segment: asString(baseline?.segment, "Generic target segment"),
    icp: asString(baseline?.icp, "Generic companies in the mentioned industry"),
    rationale: asString(
      baseline?.rationale,
      "Baseline selected a simple segment using a naive rule."
    ),
    confidence: normalizeConfidence(baseline?.confidence),
    outreachChannel: asString(baseline?.outreach?.channel, "Cold email"),
    outreachMessage: asString(
      baseline?.outreach?.message,
      "Generic outreach message based on the selected segment."
    ),
  };
}

function adaptActionPlan(actionPlan?: ActionPlanApi | null): ActionPlanView | undefined {
  if (!actionPlan) {
    return undefined;
  }

  if (Array.isArray(actionPlan)) {
    return {
      nextSteps: normalizeList(actionPlan),
      messageVariations: [],
      metricsToTrack: [],
    };
  }

  return {
    nextSteps: normalizeList(recordValue(actionPlan, "next_steps")),
    messageVariations: normalizeList(recordValue(actionPlan, "message_variations")),
    metricsToTrack: normalizeList(recordValue(actionPlan, "metrics_to_track")),
  };
}

export function adaptAnalysisRun(apiRun: AnalysisRunApi): AnalysisViewModel {
  const agent = apiRun.agent_output ?? apiRun.result ?? {};

  const markets = Array.isArray(agent.markets)
    ? agent.markets.slice(0, 3).map(adaptMarket)
    : [];

  return {
    runId: asNumber(apiRun.id ?? apiRun.run_id, 0),
    companyId: typeof apiRun.company_id === "number" ? apiRun.company_id : undefined,
    companyName: getAnalysisCompanyName(apiRun),
    status: normalizeStatus(apiRun.status),
    mode: normalizeMode(apiRun.mode),
    createdAt: apiRun.created_at,

    diagnosis: asString(
      agent.diagnosis,
      "SalesCompass analyzed the submitted company profile and generated an ICP recommendation."
    ),

    benchmarks: adaptBenchmarks(agent.external_benchmarks),

    markets,

    recommendedICP: adaptICP(agent.icp),

    outreach: adaptOutreach(agent.approach),

    hypothesesToValidate: normalizeList(agent.hypotheses_to_validate),

    questionsForHuman: normalizeList(agent.questions_for_human),

    baseline: adaptBaseline(apiRun.baseline_output),

    actionPlan: adaptActionPlan(apiRun.action_plan),

    errorMessage: apiRun.error_message ?? null,
  };
}

function getAnalysisCompanyName(apiRun: AnalysisRunApi): string | undefined {
  const companyName = apiRun.company?.name;
  if (typeof companyName === "string" && companyName.trim()) {
    return companyName.trim();
  }

  const snapshotName = apiRun.input_snapshot?.name;
  return typeof snapshotName === "string" && snapshotName.trim() ? snapshotName.trim() : undefined;
}
