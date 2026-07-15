import type { EvaluationResult } from "@/types/evaluation";
import { Card } from "@/components/ui/Card";
import { ConfidenceBadge } from "@/components/results/ConfidenceBadge";

export function BaselineVsAgent({ result }: { result: EvaluationResult }) {
  const agentIcp =
    result.agent_result.recommended_icp ??
    result.agent_result.icp?.profile ??
    "Agent ICP unavailable";
  const agentConfidence =
    result.agent_result.icp?.confidence ?? result.agent_result.confidence ?? "medium";
  const diagnosis = result.agent_result.diagnosis ?? "No agent diagnosis returned.";

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <h2 className="text-base font-semibold">Baseline output</h2>
        <p className="mt-3 text-lg font-semibold">
          {result.baseline_result.recommended_icp || result.baseline_result.icp}
        </p>
        <p className="mt-3 text-sm leading-6 text-neutral-700">{result.baseline_result.rationale}</p>
        <p className="mt-3 text-sm font-medium text-neutral-700">{result.baseline_result.next_step}</p>
      </Card>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Agent output</h2>
          <ConfidenceBadge value={agentConfidence} />
        </div>
        <p className="mt-3 text-lg font-semibold">{agentIcp}</p>
        <p className="mt-3 text-sm leading-6 text-neutral-700">{diagnosis}</p>
      </Card>
    </div>
  );
}
