import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import type { ResultLoadError } from "@/hooks/useAnalysisResult";

export function ResultLoadingState() {
  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase text-neutral-500">Live workflow result</p>
        <div className="mt-2 h-8 w-64 max-w-full animate-pulse rounded-md bg-field" />
        <div className="mt-3">
          <Spinner label="Loading results" />
        </div>
      </div>
      <div className="grid gap-5">
        {[
          "Recommended ICP",
          "Candidate Market Scores",
          "Outreach Strategy",
          "Why This Beats the Baseline",
          "Human Checkpoint",
          "Action Plan",
        ].map((title) => (
          <Card key={title}>
            <div className="flex items-center justify-between gap-4">
              <div className="h-4 w-44 animate-pulse rounded-full bg-field" />
              <div className="h-6 w-20 animate-pulse rounded-full bg-field" />
            </div>
            <div className="mt-5 grid gap-3">
              <div className="h-3 w-full animate-pulse rounded-full bg-field" />
              <div className="h-3 w-5/6 animate-pulse rounded-full bg-field" />
              <div className="h-3 w-2/3 animate-pulse rounded-full bg-field" />
            </div>
            <span className="sr-only">{title} loading</span>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ResultErrorState({ error }: { error: ResultLoadError }) {
  return (
    <EmptyState title={error.title}>
      <p>{error.message}</p>
    </EmptyState>
  );
}

export function InlineResultError({ error }: { error: ResultLoadError }) {
  return (
    <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      <span className="font-semibold">{error.title}.</span> {error.message}
    </div>
  );
}
