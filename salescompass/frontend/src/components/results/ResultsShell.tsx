"use client";

import { useState } from "react";
import type { AnalysisRunApi, AnalysisViewModel } from "@/types/analysis";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/formatters";
import { generateActionPlan } from "@/lib/api";
import { ActionPlanCard } from "./ActionPlanCard";
import { BaselineComparisonCard } from "./BaselineComparisonCard";
import { ExternalBenchmarksCard } from "./ExternalBenchmarksCard";
import { HumanCheckpoint } from "./HumanCheckpoint";
import { ICPCard } from "./ICPCard";
import { MarketScoresChart } from "./MarketScoresChart";
import { MessageVariations } from "./MessageVariations";
import { ModeEvidenceCard } from "./ModeEvidenceCard";
import { SegmentScoreCard } from "./SegmentScoreCard";

export function ResultsShell({
  run,
  onRefresh,
  onRunUpdated
}: {
  run: AnalysisViewModel;
  onRefresh: () => Promise<AnalysisViewModel | null>;
  onRunUpdated: (apiRun: AnalysisRunApi) => AnalysisViewModel;
}) {
  const [generatingActionPlan, setGeneratingActionPlan] = useState(false);
  const [actionPlanError, setActionPlanError] = useState<string | null>(null);
  const [actionPlanMessage, setActionPlanMessage] = useState<string | null>(null);
  const checkpoint =
    run.questionsForHuman.length > 0
      ? run.questionsForHuman[0]
      : run.recommendedICP.confidenceBasis;
  const isApproved = run.reviewStatus === "approved";

  async function handleGenerateActionPlan() {
    if (!isApproved) {
      setActionPlanError("Approve the recommendation first, then generate the action plan.");
      return;
    }

    setGeneratingActionPlan(true);
    setActionPlanError(null);
    setActionPlanMessage(null);
    try {
      await generateActionPlan(run.runId);
      await onRefresh();
      setActionPlanMessage("Action plan generated. The workflow is ready for execution.");
    } catch {
      setActionPlanError(
        "The action plan did not generate. The approved recommendation is still safe."
      );
    } finally {
      setGeneratingActionPlan(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Live workflow result"
        title={run.companyName ?? `Analysis #${run.runId}`}
        action={<Badge tone={statusTone(run.status)}>{formatStatus(run.status)}</Badge>}
      >
        {run.createdAt ? `Created ${formatDate(run.createdAt)}` : "Normalized ICP recommendation"}
      </PageHeader>

      {run.status === "failed" ? (
        <FailedAnalysisState errorMessage={run.errorMessage} />
      ) : (
        <div className="grid gap-5">
          {run.errorMessage ? <WorkflowWarning errorMessage={run.errorMessage} /> : null}

          <ICPCard icp={run.recommendedICP} diagnosis={run.diagnosis} />

          <ModeEvidenceCard
            mode={run.mode}
            evidence={run.modeEvidence}
            confidence={run.recommendedICP.confidence}
            confidenceBasis={run.recommendedICP.confidenceBasis}
            hypotheses={run.hypothesesToValidate}
            questions={run.questionsForHuman}
          />

          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <MarketScoresChart segments={run.markets} title="Candidate Market Scores" />
            <div className="grid content-start gap-3">
              {run.markets.length > 0 ? (
                run.markets
                  .slice(0, 3)
                  .map((segment) => <SegmentScoreCard key={segment.name} segment={segment} />)
              ) : (
                <NoCandidateMarketsCard />
              )}
            </div>
          </div>

          <ExternalBenchmarksCard benchmarks={run.benchmarks} />

          <MessageVariations
            outreach={run.outreach}
            variations={run.actionPlan?.messageVariations}
          />

          <BaselineComparisonCard
            baseline={run.baseline}
            recommendedICP={run.recommendedICP.profile}
          />

          <HumanCheckpoint
            runId={run.runId}
            prompt={checkpoint}
            questions={run.questionsForHuman}
            hypotheses={run.hypothesesToValidate}
            reviewStatus={run.reviewStatus}
            onRefresh={onRefresh}
            onRunUpdated={onRunUpdated}
          />

          <ActionPlanCard
            summary={run.actionPlan?.summary}
            steps={run.actionPlan?.nextSteps ?? []}
            messageVariations={run.actionPlan?.messageVariations}
            metrics={run.actionPlan?.metricsToTrack}
            canGenerate={isApproved}
            generating={generatingActionPlan}
            generationError={actionPlanError}
            generationMessage={actionPlanMessage}
            onGenerate={handleGenerateActionPlan}
          />
        </div>
      )}
    </div>
  );
}

function WorkflowWarning({ errorMessage }: { errorMessage: string }) {
  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <h2 className="text-base font-semibold text-amber-950">Last workflow step needs attention</h2>
      <p className="mt-2 text-sm leading-6 text-amber-900">
        The recommendation is still available, but the backend reported an issue during the most
        recent refinement or action-plan step.
      </p>
      <p className="mt-3 rounded-md bg-white px-3 py-2 text-sm leading-6 text-amber-900">
        {errorMessage}
      </p>
    </Card>
  );
}

function FailedAnalysisState({ errorMessage }: { errorMessage?: string | null }) {
  return (
    <Card className="border-red-200 bg-red-50/40">
      <h2 className="text-base font-semibold text-red-950">Analysis failed</h2>
      <p className="mt-2 text-sm leading-6 text-red-900">
        SalesCompass could not produce a usable recommendation for this workflow result. The
        submitted company inputs are still stored, but this run needs to be rerun before it can
        show ICP, market, outreach, and action-plan sections.
      </p>
      <div className="mt-4 rounded-md border border-red-200 bg-white px-3 py-3">
        <div className="text-xs font-semibold uppercase text-red-700">Stored backend error</div>
        <p className="mt-2 text-sm leading-6 text-red-900">
          {errorMessage?.trim() || "No backend error was stored for this failed analysis."}
        </p>
      </div>
    </Card>
  );
}

function NoCandidateMarketsCard() {
  return (
    <Card>
      <h3 className="text-sm font-semibold">No candidate markets returned</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-600">
        This run did not return scored markets. Use Human Checkpoint to request a refinement with
        the market, buyer, or pain you want SalesCompass to test.
      </p>
    </Card>
  );
}

function formatStatus(status: AnalysisViewModel["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusTone(status: AnalysisViewModel["status"]) {
  if (status === "completed") {
    return "green";
  }

  if (status === "failed") {
    return "red";
  }

  return "amber";
}
