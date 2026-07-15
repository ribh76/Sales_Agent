import type { AnalysisRun } from "@/types/analysis";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatDate } from "@/lib/formatters";
import { ActionPlanCard } from "./ActionPlanCard";
import { BaselineComparisonCard } from "./BaselineComparisonCard";
import { DiagnosisCard } from "./DiagnosisCard";
import { ExternalBenchmarksCard } from "./ExternalBenchmarksCard";
import { HumanCheckpoint } from "./HumanCheckpoint";
import { ICPCard } from "./ICPCard";
import { MarketScoresChart } from "./MarketScoresChart";
import { MessageVariations } from "./MessageVariations";
import { SegmentScoreCard } from "./SegmentScoreCard";

export function ResultsShell({ run }: { run: AnalysisRun }) {
  const { result } = run;

  return (
    <div>
      <PageHeader eyebrow="ICP Run" title={run.company?.name ?? run.input_snapshot.name}>
        Completed {formatDate(run.completed_at)} using {run.model_name}.
      </PageHeader>

      <div className="grid gap-5">
        <div className="grid gap-5 xl:grid-cols-[1fr_0.75fr]">
          <DiagnosisCard diagnosis={result.diagnosis} confidence={result.confidence} />
          <ICPCard icp={result.recommended_icp} assumptions={result.assumptions} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <section>
            <h2 className="mb-3 text-base font-semibold">Top Candidate Segments</h2>
            <MarketScoresChart segments={result.market_scores} />
          </section>
          <div className="grid content-start gap-3">
            {result.market_scores.slice(0, 3).map((segment) => (
              <SegmentScoreCard key={segment.name} segment={segment} />
            ))}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <ActionPlanCard steps={result.action_plan} />
          <ExternalBenchmarksCard benchmarks={result.external_benchmarks} />
        </div>

        <MessageVariations outreach={result.outreach} />

        <div className="grid gap-5 lg:grid-cols-2">
          <HumanCheckpoint runId={run.id} prompt={result.human_checkpoint} />
          <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
            <h2 className="text-base font-semibold">Disqualifiers</h2>
            <ul className="mt-3 grid gap-2 text-sm text-neutral-700">
              {result.disqualifiers.map((item) => (
                <li key={item} className="rounded-md bg-field px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <BaselineComparisonCard baseline={run.baseline_output} agentIcp={result.recommended_icp} />
      </div>
    </div>
  );
}
