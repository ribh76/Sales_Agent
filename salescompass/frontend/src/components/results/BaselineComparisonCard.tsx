import type { BaselineView } from "@/types/analysis";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function BaselineComparisonCard({
  baseline,
  recommendedICP
}: {
  baseline: BaselineView;
  recommendedICP: string;
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Why This Beats the Baseline</h2>
        {baseline.confidence ? <Badge tone="amber">Baseline confidence: {baseline.confidence}</Badge> : null}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-md bg-field p-4">
          <div className="text-xs font-semibold uppercase text-neutral-500">Baseline</div>
          <p className="mt-2 text-sm font-semibold text-ink">{baseline.icp}</p>
          <p className="mt-2 text-sm leading-6 text-neutral-700">{baseline.rationale}</p>
          <p className="mt-2 text-sm font-medium text-neutral-700">
            {baseline.outreachChannel}: {baseline.outreachMessage}
          </p>
        </div>
        <div className="rounded-md bg-field p-4">
          <div className="text-xs font-semibold uppercase text-neutral-500">Recommended ICP</div>
          <p className="mt-2 text-sm font-semibold text-ink">{recommendedICP}</p>
          <p className="mt-2 text-sm leading-6 text-neutral-700">
            Uses ranked markets, targeted outreach, validation questions, and a concrete action plan instead of a
            single broad segment pick.
          </p>
        </div>
      </div>
    </Card>
  );
}
