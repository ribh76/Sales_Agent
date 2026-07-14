import type { SegmentScore } from "@/types/analysis";
import { Card } from "@/components/ui/Card";

export function MarketScoresChart({ segments }: { segments: SegmentScore[] }) {
  return (
    <Card>
      <h2 className="text-base font-semibold">Market scores</h2>
      <div className="mt-4 grid gap-3">
        {segments.map((segment) => (
          <div key={segment.name} className="grid gap-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">{segment.name}</span>
              <span className="tabular-nums text-neutral-600">{segment.score}</span>
            </div>
            <div className="h-2 rounded-full bg-field">
              <div
                className="h-2 rounded-full bg-signal"
                style={{ width: `${Math.max(8, segment.score)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

