"use client";

import { useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import {
  InlineResultError,
  ResultErrorState,
  ResultLoadingState,
} from "@/components/results/ResultPageStates";
import { ResultsShell } from "@/components/results/ResultsShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAnalysisResult } from "@/hooks/useAnalysisResult";

export default function ResultPage() {
  const params = useParams<{ runId: string }>();
  const { run, loading, error, refresh, applyRun } = useAnalysisResult(params.runId);

  return (
    <AppShell>
      <ProtectedRoute>
        {loading && !run ? <ResultLoadingState /> : null}
        {!loading && error && !run ? <ResultErrorState error={error} /> : null}
        {!loading && !error && !run ? (
          <EmptyState title="Result not found">
            This workflow result is not available. It may have been deleted or created under a
            different account.
          </EmptyState>
        ) : null}
        {run ? (
          <>
            {error ? <InlineResultError error={error} /> : null}
            <ResultsShell run={run} onRefresh={refresh} onRunUpdated={applyRun} />
          </>
        ) : null}
      </ProtectedRoute>
    </AppShell>
  );
}
