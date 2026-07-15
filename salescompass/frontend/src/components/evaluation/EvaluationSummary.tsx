import type { EvaluationResult, EvaluationSummaryData } from "@/types/evaluation";
import { Badge } from "@/components/ui/Badge";
import { ConfidenceMetricCard } from "./ConfidenceMetricCard";

export function EvaluationSummary({
  result,
  summary
}: {
  result: EvaluationResult;
  summary: EvaluationSummaryData | null;
}) {
  const agent = result.scorecard.agent;
  const baseline = result.scorecard.baseline;

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Summary metrics</h2>
        <Badge tone={result.confidence_pass ? "green" : "red"}>
          Confidence {result.confidence_pass ? "pass" : "fail"}
        </Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ConfidenceMetricCard label="Agent specificity" value={agent.specificity} />
        <ConfidenceMetricCard label="Agent actionability" value={agent.actionability} />
        <ConfidenceMetricCard label="Baseline specificity" value={baseline.specificity} />
        <ConfidenceMetricCard label="Baseline evidence" value={baseline.evidence_quality} />
      </div>
      {summary ? (
        <div className="grid gap-3 rounded-lg border border-line bg-white p-4 text-sm text-neutral-700 shadow-panel sm:grid-cols-3">
          <Metric label="Total runs" value={summary.total_results.toString()} />
          <Metric
            label="Confidence pass rate"
            value={summary.confidence_pass_rate === null ? "No data" : `${Math.round(summary.confidence_pass_rate * 100)}%`}
          />
          <Metric
            label="Human preferences"
            value={`Agent ${summary.human_preferences.agent} / Baseline ${summary.human_preferences.baseline} / Tie ${summary.human_preferences.tie}`}
          />
        </div>
      ) : null}
      <p className="rounded-lg border border-line bg-white p-4 text-sm leading-6 text-neutral-700 shadow-panel">
        {result.scorecard.summary}
      </p>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase text-neutral-500">{label}</div>
      <div className="mt-1 font-medium text-ink">{value}</div>
    </div>
  );
}
