import type { BenchmarkView } from "@/types/analysis";
import { Card } from "@/components/ui/Card";

export function ExternalBenchmarksCard({ benchmarks }: { benchmarks: BenchmarkView[] }) {
  return (
    <Card>
      <h2 className="text-base font-semibold">Market Benchmark Context</h2>
      <ul className="mt-3 grid gap-2 text-sm text-neutral-700">
        {benchmarks.map((benchmark) => (
          <li key={`${benchmark.stat}-${benchmark.source}`} className="rounded-md bg-field px-3 py-2">
            <div className="font-medium text-ink">{benchmark.stat}</div>
            <div className="mt-1 text-xs text-neutral-500">{benchmark.source}</div>
          </li>
        ))}
        {benchmarks.length === 0 ? (
          <li className="rounded-md bg-field px-3 py-2">
            No market benchmarks were returned. The recommendation is using submitted company
            inputs, market scores, and validation assumptions until stronger benchmark evidence is
            available.
          </li>
        ) : null}
      </ul>
    </Card>
  );
}
