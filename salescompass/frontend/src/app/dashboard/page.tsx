"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Clock, Sparkles, Target } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Spinner } from "@/components/ui/Spinner";
import { ConfidenceBadge } from "@/components/results/ConfidenceBadge";
import { listAnalyses } from "@/lib/api";
import { formatDate } from "@/lib/formatters";
import type { AnalysisRun } from "@/types/analysis";

export default function DashboardPage() {
  return (
    <AppShell>
      <ProtectedRoute>
        <DashboardContent />
      </ProtectedRoute>
    </AppShell>
  );
}

function DashboardContent() {
  const [runs, setRuns] = useState<AnalysisRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAnalyses()
      .then(setRuns)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load analyses."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
        <PageHeader
          eyebrow="Workspace"
          title="Previous analyses"
          action={
            <Link href="/analyze">
              <Button icon={<Sparkles aria-hidden className="h-4 w-4" />}>New analysis</Button>
            </Link>
          }
        >
          Review past ICP runs and open the full result when you need the recommendation, outreach, and action plan.
        </PageHeader>

        <div className="mb-5 grid gap-4 lg:grid-cols-3">
          <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
            <Target aria-hidden className="h-5 w-5 text-signal" />
            <h2 className="mt-3 text-base font-semibold">Runs</h2>
            <p className="mt-2 text-3xl font-semibold">{runs.length}</p>
          </section>
          <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
            <BarChart3 aria-hidden className="h-5 w-5 text-caution" />
            <h2 className="mt-3 text-base font-semibold">Evaluation</h2>
            <Link href="/evaluation" className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-signal">
              Open class evaluation
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </section>
          <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
            <Clock aria-hidden className="h-5 w-5 text-coral" />
            <h2 className="mt-3 text-base font-semibold">Latest</h2>
            <p className="mt-2 text-sm text-neutral-700">{runs[0] ? formatDate(runs[0].created_at) : "No runs yet"}</p>
          </section>
        </div>

        {loading ? (
          <div className="flex min-h-40 items-center justify-center rounded-lg border border-line bg-white shadow-panel">
            <Spinner label="Loading analyses" />
          </div>
        ) : null}
        <ErrorMessage message={error} />

        {!loading && !error && runs.length === 0 ? (
          <EmptyState title="No analyses yet">
            <Link href="/analyze" className="font-medium text-signal">
              Start the first analysis
            </Link>
          </EmptyState>
        ) : null}

        {!loading && runs.length > 0 ? (
          <section className="overflow-hidden rounded-lg border border-line bg-white shadow-panel">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-field text-xs font-semibold uppercase text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Company name</th>
                    <th className="px-4 py-3">Mode</th>
                    <th className="px-4 py-3">Confidence</th>
                    <th className="px-4 py-3">Created date</th>
                    <th className="px-4 py-3">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {runs.map((run) => (
                    <tr key={run.id} className="align-top">
                      <td className="px-4 py-4 font-medium text-ink">
                        {run.company?.name ?? run.input_snapshot.name}
                      </td>
                      <td className="px-4 py-4">
                        <Badge tone="neutral">{formatMode(run.mode)}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <ConfidenceBadge value={run.result.confidence} />
                      </td>
                      <td className="px-4 py-4 text-neutral-700">{formatDate(run.created_at)}</td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/results/${run.id}`}
                          className="inline-flex items-center gap-2 font-medium text-signal"
                        >
                          View result
                          <ArrowRight aria-hidden className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
    </>
  );
}

function formatMode(mode: string) {
  return mode === "no_history" ? "No history" : "History";
}
