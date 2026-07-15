import type { MarketSegmentView } from "@/types/analysis";
import { Card } from "@/components/ui/Card";

export function SegmentScoreCard({ segment }: { segment: MarketSegmentView }) {
  return (
    <Card className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{segment.name}</h3>
        <span className="text-xl font-semibold text-signal">{segment.total}/10</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600 sm:grid-cols-5">
        <Metric label="Size" value={segment.scores.size} />
        <Metric label="Access" value={segment.scores.access} />
        <Metric label="Ticket" value={segment.scores.ticket} />
        <Metric label="Cycle" value={segment.scores.cycle} />
        <Metric label="Competition" value={segment.scores.competition} />
      </div>
      <p className="text-sm leading-6 text-neutral-700">{segment.rationale}</p>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-field px-2 py-2">
      <div className="font-medium text-ink">{value}</div>
      <div>{label}</div>
    </div>
  );
}
