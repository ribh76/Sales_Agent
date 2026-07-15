import type { BaselineOutput } from "@/types/analysis";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function BaselineComparisonCard({
  baseline,
  agentIcp
}: {
  baseline: BaselineOutput;
  agentIcp: string;
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Baseline Comparison</h2>
        {baseline.confidence ? <Badge tone="amber">Baseline confidence: {baseline.confidence}</Badge> : null}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-md bg-field p-4">
          <div className="text-xs font-semibold uppercase text-neutral-500">Baseline output</div>
          <p className="mt-2 text-sm font-semibold text-ink">
            {baseline.recommended_icp || baseline.icp || "Broad target companies"}
          </p>
          {baseline.rationale ? (
            <p className="mt-2 text-sm leading-6 text-neutral-700">{baseline.rationale}</p>
          ) : null}
          {baseline.next_step ? (
            <p className="mt-2 text-sm font-medium text-neutral-700">{baseline.next_step}</p>
          ) : null}
        </div>
        <div className="rounded-md bg-field p-4">
          <div className="text-xs font-semibold uppercase text-neutral-500">Agent output</div>
          <p className="mt-2 text-sm font-semibold text-ink">{agentIcp}</p>
          <p className="mt-2 text-sm leading-6 text-neutral-700">
            Uses ranked segments, disqualifiers, outreach messaging, and a human checkpoint instead of a single broad
            segment pick.
          </p>
        </div>
      </div>
    </Card>
  );
}
