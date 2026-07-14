import type { SegmentScore } from "@/types/analysis";
import { Card } from "@/components/ui/Card";

export function SegmentScoreCard({ segment }: { segment: SegmentScore }) {
  return (
    <Card className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{segment.name}</h3>
        <span className="text-xl font-semibold text-signal">{segment.score}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600 sm:grid-cols-4">
        <Metric label="Fit" value={segment.fit} />
        <Metric label="Urgency" value={segment.urgency} />
        <Metric label="Reach" value={segment.reachability} />
        <Metric label="Deal" value={segment.deal_quality} />
      </div>
      <ul className="grid gap-1 text-sm text-neutral-700">
        {segment.evidence.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
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

