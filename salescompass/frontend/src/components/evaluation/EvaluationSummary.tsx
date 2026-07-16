import type { EvaluationSummaryView } from "@/types/evaluation";
import { Card } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

const EMPTY_SUMMARY: EvaluationSummaryView = {
  totalProfiles: 0,
  profilesTested: 0,
  totalEvaluations: 0,
  confidencePassed: 0,
  confidenceFailed: 0,
  confidencePassRate: 0,
  agentPreferred: 0,
  baselinePreferred: 0,
  ties: 0,
};

export function EvaluationSummary({
  summary,
  loading = false,
  error = null,
}: {
  summary: EvaluationSummaryView | null;
  loading?: boolean;
  error?: string | null;
}) {
  const safeSummary = summary ?? EMPTY_SUMMARY;
  const passRate = Number.isFinite(safeSummary.confidencePassRate)
    ? safeSummary.confidencePassRate
    : 0;

  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Evaluation Summary</h2>
        {loading ? <span className="text-sm text-neutral-500">Refreshing summary...</span> : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Profiles Tested" value={safeSummary.profilesTested.toString()} />
        <SummaryCard label="Confidence Pass Rate" value={`${Math.round(passRate * 100)}%`} />
        <SummaryCard label="Agent Preferred" value={safeSummary.agentPreferred.toString()} />
        <SummaryCard label="Baseline Preferred" value={safeSummary.baselinePreferred.toString()} />
        <SummaryCard label="Ties" value={safeSummary.ties.toString()} />
      </div>
      <ErrorMessage message={error} />
      {!summary && !loading ? (
        <p className="text-sm text-neutral-600">
          Run an evaluation and save a rating to update this summary.
        </p>
      ) : null}
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs font-semibold uppercase text-neutral-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-ink">{value}</div>
    </Card>
  );
}
