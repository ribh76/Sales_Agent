import type { EvaluationResult } from "@/types/evaluation";
import { ConfidenceMetricCard } from "./ConfidenceMetricCard";

export function EvaluationSummary({ result }: { result: EvaluationResult }) {
  const agent = result.scorecard.agent;
  const baseline = result.scorecard.baseline;

  return (
    <section className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ConfidenceMetricCard label="Agent specificity" value={agent.specificity} />
        <ConfidenceMetricCard label="Agent actionability" value={agent.actionability} />
        <ConfidenceMetricCard label="Baseline specificity" value={baseline.specificity} />
        <ConfidenceMetricCard label="Baseline evidence" value={baseline.evidence_quality} />
      </div>
      <p className="rounded-lg border border-line bg-white p-4 text-sm leading-6 text-neutral-700 shadow-panel">
        {result.scorecard.summary}
      </p>
    </section>
  );
}

