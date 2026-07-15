import type { AnalysisViewModel } from "@/types/analysis";
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

export function ResultsShell({ run }: { run: AnalysisViewModel }) {
  const checkpoint =
    run.questionsForHuman.length > 0
      ? run.questionsForHuman.join(" ")
      : run.recommendedICP.confidenceBasis;
  const actionSteps =
    run.actionPlan?.nextSteps.length ? run.actionPlan.nextSteps : run.hypothesesToValidate;

  return (
    <div>
      <PageHeader eyebrow="ICP Run" title={run.companyName ?? `Analysis #${run.runId}`}>
        {run.status === "completed" ? "Completed" : formatStatus(run.status)}{" "}
        {run.createdAt ? formatDate(run.createdAt) : ""}
      </PageHeader>

      <div className="grid gap-5">
        <div className="grid gap-5 xl:grid-cols-[1fr_0.75fr]">
          <DiagnosisCard diagnosis={run.diagnosis} confidence={run.recommendedICP.confidence} />
          <ICPCard icp={run.recommendedICP} hypotheses={run.hypothesesToValidate} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <section>
            <h2 className="mb-3 text-base font-semibold">Top Candidate Segments</h2>
            <MarketScoresChart segments={run.markets} />
          </section>
          <div className="grid content-start gap-3">
            {run.markets.slice(0, 3).map((segment) => (
              <SegmentScoreCard key={segment.name} segment={segment} />
            ))}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <ActionPlanCard
            steps={actionSteps}
            metrics={run.actionPlan?.metricsToTrack}
          />
          <ExternalBenchmarksCard benchmarks={run.benchmarks} />
        </div>

        <MessageVariations
          outreach={run.outreach}
          variations={run.actionPlan?.messageVariations}
        />

        <div className="grid gap-5 lg:grid-cols-2">
          <HumanCheckpoint runId={run.runId} prompt={checkpoint} />
          <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
            <h2 className="text-base font-semibold">Questions for human</h2>
            <ul className="mt-3 grid gap-2 text-sm text-neutral-700">
              {run.questionsForHuman.map((item) => (
                <li key={item} className="rounded-md bg-field px-3 py-2">
                  {item}
                </li>
              ))}
              {run.questionsForHuman.length === 0 ? (
                <li className="rounded-md bg-field px-3 py-2">
                  No follow-up questions returned.
                </li>
              ) : null}
            </ul>
          </section>
        </div>

        <BaselineComparisonCard baseline={run.baseline} agentIcp={run.recommendedICP.profile} />
      </div>
    </div>
  );
}

function formatStatus(status: AnalysisViewModel["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
