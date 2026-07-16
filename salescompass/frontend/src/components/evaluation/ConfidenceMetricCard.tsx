import type { EvaluationResultView } from "@/types/evaluation";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ConfidenceBadge } from "@/components/results/ConfidenceBadge";

export function ConfidenceMetricCard({ result }: { result: EvaluationResultView }) {
  const check = result.confidenceCheck;
  const confidence = result.agentViewModel.recommendedICP.confidence;
  const tone = check.passed === null ? "neutral" : check.passed ? "green" : "red";
  const border = check.passed === null
    ? ""
    : check.passed
      ? "border-signal/30"
      : "border-red-300";

  return (
    <Card className={border}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Confidence Check</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Metric 1 verifies whether the agent stays appropriately cautious on thin-data profiles.
          </p>
        </div>
        <Badge tone={tone}>{check.label}</Badge>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Profile type" value={result.profile.isThinData ? "Thin data" : result.profile.dataStrengthLabel} />
        <Metric label="Expected" value={check.expected || "Not applicable"} />
        <div className="rounded-md bg-field px-3 py-3">
          <div className="text-xs font-semibold uppercase text-neutral-500">Agent gave</div>
          <div className="mt-2">
            <ConfidenceBadge value={confidence} />
          </div>
        </div>
        <Metric label="Result" value={check.label} tone={tone} />
      </div>

      <p className="mt-4 rounded-md bg-field px-3 py-3 text-sm leading-6 text-neutral-700">
        {check.explanation || fallbackExplanation(result)}
      </p>
    </Card>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "green" | "amber" | "neutral" | "red";
}) {
  const toneClass = tone === "green"
    ? "text-teal-800"
    : tone === "red"
      ? "text-red-800"
      : "text-ink";

  return (
    <div className="rounded-md bg-field px-3 py-3">
      <div className="text-xs font-semibold uppercase text-neutral-500">{label}</div>
      <div className={`mt-1 text-sm font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}

function fallbackExplanation(result: EvaluationResultView): string {
  if (!result.profile.isThinData) {
    return "This case is not judged by the thin-data confidence rule.";
  }

  return result.agentViewModel.recommendedICP.confidence === "high"
    ? "The agent was overconfident for a thin-data case."
    : "The agent correctly avoided overconfidence.";
}
