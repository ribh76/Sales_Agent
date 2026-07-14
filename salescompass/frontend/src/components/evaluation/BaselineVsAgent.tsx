import type { EvaluationResult } from "@/types/evaluation";
import { Card } from "@/components/ui/Card";
import { ConfidenceBadge } from "@/components/results/ConfidenceBadge";

export function BaselineVsAgent({ result }: { result: EvaluationResult }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <h2 className="text-base font-semibold">Baseline</h2>
        <p className="mt-3 text-lg font-semibold">{result.baseline_result.recommended_icp}</p>
        <p className="mt-3 text-sm leading-6 text-neutral-700">{result.baseline_result.rationale}</p>
        <p className="mt-3 text-sm font-medium text-neutral-700">{result.baseline_result.next_step}</p>
      </Card>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">SalesCompass</h2>
          <ConfidenceBadge value={result.agent_result.confidence} />
        </div>
        <p className="mt-3 text-lg font-semibold">{result.agent_result.recommended_icp}</p>
        <p className="mt-3 text-sm leading-6 text-neutral-700">{result.agent_result.diagnosis}</p>
      </Card>
    </div>
  );
}

