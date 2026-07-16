import type {
  ActionPlanApi,
  ActionPlanStepView,
  ActionPlanView,
  ActionMessageVariationView,
  AnalysisRunApi,
  AnalysisStatus,
  AnalysisViewModel,
  BaselineOutputApi,
  BaselineView,
  BenchmarkApi,
  BenchmarkView,
  CompanyMode,
  ConfidenceLevel,
  DowngradedSegmentView,
  EvidenceItemView,
  ICPOutputApi,
  MarketSegmentApi,
  MarketSegmentView,
  ModeEvidenceView,
  OutreachOutputApi,
  OutreachView,
  RecommendedICPView,
  ReviewStatus,
  SegmentScoresView,
} from "@/types/analysis";

const DEFAULT_CONFIDENCE: ConfidenceLevel = "medium";

const DEMO_MARKET_CONTEXT: Record<string, EvidenceItemView[]> = {
  manufacturing: [
    { label: "Market size", value: "Large industrial market with recurring operational pain." },
    { label: "Sales cycle", value: "Typically 30-90 days for mid-market services." },
    { label: "Competition", value: "Moderate competition from consultants and software vendors." },
  ],
  healthcare: [
    { label: "Market size", value: "Large regulated market with persistent workflow and access pressure." },
    { label: "Sales cycle", value: "Typically 60-180 days depending on compliance and procurement needs." },
    { label: "Competition", value: "High competition from vertical SaaS vendors and services firms." },
  ],
  logistics: [
    { label: "Market size", value: "Large operational market with recurring cost, routing, and visibility pain." },
    { label: "Sales cycle", value: "Typically 30-120 days for mid-market operations teams." },
    { label: "Competition", value: "Moderate competition from point solutions, brokers, and consultants." },
  ],
  "real estate": [
    { label: "Market size", value: "Cyclical but large market with fragmented operators and local workflows." },
    { label: "Sales cycle", value: "Typically 30-90 days for teams with clear transaction or leasing pain." },
    { label: "Competition", value: "Moderate competition from brokerage tools, CRMs, and service providers." },
  ],
  general: [
    {
      label: "Demo market context",
      value: "Use a narrow, testable market definition until stronger evidence is available.",
    },
    {
      label: "Validation cycle",
      value: "Assume a short validation cycle before committing to a scaled sales motion.",
    },
    {
      label: "Competitive assumptions",
      value: "Validate alternatives directly with prospects before positioning against competitors.",
    },
  ],
};

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

function asDisplayString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    const parts = value
      .map(asDisplayString)
      .filter((item): item is string => Boolean(item));
    return parts.length ? parts.join(", ") : undefined;
  }

  if (value && typeof value === "object") {
    const parts = Object.entries(value)
      .map(([key, nestedValue]) => {
        const displayValue = asDisplayString(nestedValue);
        return displayValue ? `${formatEvidenceLabel(key)}: ${displayValue}` : undefined;
      })
      .filter((item): item is string => Boolean(item));
    return parts.length ? parts.join("; ") : undefined;
  }

  return undefined;
}

function evidenceItem(
  source: Record<string, unknown> | undefined,
  key: string,
  label: string,
  formatter: (value: unknown) => string | undefined = asDisplayString
): EvidenceItemView | undefined {
  const value = source?.[key];
  const displayValue = formatter(value);
  return displayValue ? { label, value: displayValue } : undefined;
}

function compactEvidence(items: Array<EvidenceItemView | undefined>): EvidenceItemView[] {
  return items.filter((item): item is EvidenceItemView => Boolean(item));
}

function formatCurrencyValue(value: unknown): string | undefined {
  const numericValue = asNumber(value, Number.NaN);
  if (!Number.isFinite(numericValue)) {
    return asDisplayString(value);
  }

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function formatPercentValue(value: unknown): string | undefined {
  const numericValue = asNumber(value, Number.NaN);
  if (!Number.isFinite(numericValue)) {
    return asDisplayString(value);
  }

  return numericValue <= 1 ? `${Math.round(numericValue * 100)}%` : `${numericValue}%`;
}

function formatDaysValue(value: unknown): string | undefined {
  const numericValue = asNumber(value, Number.NaN);
  if (!Number.isFinite(numericValue)) {
    return asDisplayString(value);
  }

  return `${numericValue} days`;
}

function formatEvidenceLabel(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
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

function normalizeReviewStatus(value: unknown): ReviewStatus {
  return value === "approved" ? "approved" : "needs_review";
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

function adaptActionStep(value: unknown, index: number): ActionPlanStepView | undefined {
  if (typeof value === "string") {
    const title = value.trim();
    return title ? { title } : undefined;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const title = asString(recordValue(value, "title"), `GTM step ${index + 1}`);

  return {
    title,
    owner: optionalString(recordValue(value, "owner")),
    timeframe: optionalString(recordValue(value, "timeframe")),
    successMetric: optionalString(recordValue(value, "success_metric")),
  };
}

function adaptActionSteps(value: unknown): ActionPlanStepView[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(adaptActionStep)
    .filter((item): item is ActionPlanStepView => Boolean(item));
}

function adaptMessageVariation(value: unknown, index: number): ActionMessageVariationView | undefined {
  if (typeof value === "string") {
    const message = value.trim();
    return message
      ? { title: `Message variation ${index + 1}`, channel: "Email", message }
      : undefined;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const message = optionalString(recordValue(value, "message"));
  if (!message) {
    return undefined;
  }

  return {
    title: asString(recordValue(value, "title"), `Message variation ${index + 1}`),
    channel: asString(recordValue(value, "channel"), "Email"),
    message,
  };
}

function adaptMessageVariations(value: unknown): ActionMessageVariationView[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(adaptMessageVariation)
    .filter((item): item is ActionMessageVariationView => Boolean(item));
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
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
      nextSteps: adaptActionSteps(actionPlan),
      messageVariations: [],
      metricsToTrack: [],
    };
  }

  return {
    summary: optionalString(recordValue(actionPlan, "summary")),
    nextSteps: adaptActionSteps(recordValue(actionPlan, "next_steps")),
    messageVariations: adaptMessageVariations(recordValue(actionPlan, "message_variations")),
    metricsToTrack: normalizeList(recordValue(actionPlan, "metrics_to_track")),
  };
}

function adaptModeEvidence(
  apiRun: AnalysisRunApi,
  markets: MarketSegmentView[]
): ModeEvidenceView {
  const snapshot = apiRun.input_snapshot;
  const salesHistory = compactEvidence([
    evidenceItem(snapshot, "customer_history", "Customer history"),
    evidenceItem(snapshot, "past_clients", "Won customer patterns"),
    evidenceItem(snapshot, "current_markets", "Current markets"),
  ]);
  const wonLostPatterns = compactEvidence([
    evidenceItem(snapshot, "past_clients", "Won patterns"),
    evidenceItem(snapshot, "past_lost_deals", "Lost deal patterns"),
    evidenceItem(snapshot, "loss_reasons", "Loss reasons"),
  ]);
  const conversionEvidence = compactEvidence([
    evidenceItem(snapshot, "average_ticket", "Average ticket", formatCurrencyValue),
    evidenceItem(snapshot, "average_contract_value", "Average contract value", formatCurrencyValue),
    evidenceItem(snapshot, "conversion_rate", "Conversion rate", formatPercentValue),
    evidenceItem(snapshot, "average_sales_cycle", "Average sales cycle", formatDaysValue),
    evidenceItem(snapshot, "margin", "Margin", formatPercentValue),
  ]);
  const marketAssumptions = compactEvidence([
    evidenceItem(snapshot, "industry", "Assumed market"),
    evidenceItem(snapshot, "problem_solved", "Problem solved"),
    evidenceItem(snapshot, "target_user_guess", "Target user guess"),
    evidenceItem(snapshot, "hypothetical_ticket", "Hypothetical ticket", formatCurrencyValue),
    evidenceItem(snapshot, "average_contract_value", "Estimated contract value", formatCurrencyValue),
    evidenceItem(snapshot, "known_competitors", "Known competitors"),
    evidenceItem(snapshot, "early_leads", "Early leads"),
  ]);

  return {
    salesHistory: salesHistory.length
      ? salesHistory
      : [
          {
            label: "Sales history",
            value: "No detailed sales history was supplied with this run.",
          },
        ],
    wonLostPatterns: wonLostPatterns.length
      ? wonLostPatterns
      : [
          {
            label: "Won/lost patterns",
            value: "No explicit won/lost pattern evidence was supplied.",
          },
        ],
    conversionEvidence: conversionEvidence.length
      ? conversionEvidence
      : [
          {
            label: "Conversion and sales cycle",
            value: "No conversion or sales-cycle metrics supplied; scoring leans on qualitative evidence.",
          },
        ],
    downgradedSegments: adaptDowngradedSegments(markets),
    marketAssumptions: marketAssumptions.length
      ? marketAssumptions
      : [
          {
            label: "Market assumptions",
            value: "No customer history supplied; validate the market definition before scaling.",
          },
        ],
    demoMarketContext: adaptDemoMarketContext(snapshot),
  };
}

function adaptDowngradedSegments(markets: MarketSegmentView[]): DowngradedSegmentView[] {
  return markets.slice(1).map((market) => ({
    name: market.name,
    score: market.total,
    rationale: market.rationale,
  }));
}

function adaptDemoMarketContext(snapshot?: Record<string, unknown>): EvidenceItemView[] {
  const haystack = [
    snapshot?.industry,
    snapshot?.description,
    snapshot?.current_markets,
    snapshot?.early_leads,
    snapshot?.known_competitors,
    snapshot?.problem_solved,
    snapshot?.target_user_guess,
  ]
    .map(asDisplayString)
    .filter((item): item is string => Boolean(item))
    .join(" ")
    .toLowerCase();

  const matchedKey = Object.keys(DEMO_MARKET_CONTEXT).find(
    (key) => key !== "general" && haystack.includes(key)
  );

  return DEMO_MARKET_CONTEXT[matchedKey ?? "general"];
}

export function adaptAnalysisRun(apiRun: AnalysisRunApi): AnalysisViewModel {
  const output = apiRun.agent_output ?? {};
  const mode = normalizeMode(apiRun.mode);

  const markets = Array.isArray(output.markets)
    ? output.markets.slice(0, 3).map(adaptMarket)
    : [];

  return {
    runId: asNumber(apiRun.id ?? apiRun.run_id, 0),
    companyId: typeof apiRun.company_id === "number" ? apiRun.company_id : undefined,
    companyName: getAnalysisCompanyName(apiRun),
    status: normalizeStatus(apiRun.status),
    mode,
    createdAt: apiRun.created_at,

    diagnosis: asString(
      output.diagnosis,
      "SalesCompass analyzed the submitted company profile and generated an ICP recommendation."
    ),

    benchmarks: adaptBenchmarks(output.external_benchmarks),

    markets,

    recommendedICP: adaptICP(output.icp),

    outreach: adaptOutreach(output.approach),

    hypothesesToValidate: normalizeList(output.hypotheses_to_validate),

    questionsForHuman: normalizeList(output.questions_for_human),

    baseline: adaptBaseline(apiRun.baseline_output),

    modeEvidence: adaptModeEvidence(apiRun, markets),

    actionPlan: adaptActionPlan(apiRun.action_plan),

    reviewStatus: normalizeReviewStatus(apiRun.review_status),

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
