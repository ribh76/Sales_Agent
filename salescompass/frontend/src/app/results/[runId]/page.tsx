"use client";

import { useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { ResultsShell } from "@/components/results/ResultsShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Spinner } from "@/components/ui/Spinner";
import { useAnalysisResult } from "@/hooks/useAnalysisResult";

export default function ResultPage() {
  const params = useParams<{ runId: string }>();
  const { run, loading, error } = useAnalysisResult(params.runId);

  return (
    <AppShell>
      <ProtectedRoute>
        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <Spinner label="Loading results" />
          </div>
        ) : null}
        <ErrorMessage message={error} />
        {!loading && !error && !run ? <EmptyState title="Run not found" /> : null}
        {run ? <ResultsShell run={run} /> : null}
      </ProtectedRoute>
    </AppShell>
  );
}

