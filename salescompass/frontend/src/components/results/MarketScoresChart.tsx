import type { MarketSegmentView } from "@/types/analysis";
import { Card } from "@/components/ui/Card";

export function MarketScoresChart({
  segments,
  title = "Market scores"
}: {
  segments: MarketSegmentView[];
  title?: string;
}) {
  return (
    <Card>
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-4 grid gap-3">
        {segments.map((segment) => (
          <div key={segment.name} className="grid gap-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">{segment.name}</span>
              <span className="tabular-nums text-neutral-600">{segment.total}/10</span>
            </div>
            <div className="h-2 rounded-full bg-field">
              <div
                className="h-2 rounded-full bg-signal"
                style={{ width: `${Math.max(8, segment.total * 10)}%` }}
              />
            </div>
          </div>
        ))}
        {segments.length === 0 ? (
          <p className="text-sm leading-6 text-neutral-600">
            No candidate markets were returned. Refine the result with a target buyer, market, or
            pain point so SalesCompass can score segments for the next pass.
          </p>
        ) : null}
      </div>
    </Card>
  );
}
