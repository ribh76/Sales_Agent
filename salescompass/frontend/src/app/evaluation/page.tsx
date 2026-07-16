"use client";

import { Play, RefreshCw } from "lucide-react";
import { BaselineVsAgent } from "@/components/evaluation/BaselineVsAgent";
import { ConfidenceMetricCard } from "@/components/evaluation/ConfidenceMetricCard";
import { EvaluationProfilePicker } from "@/components/evaluation/EvaluationProfilePicker";
import { EvaluationSummary } from "@/components/evaluation/EvaluationSummary";
import { HumanRatingForm } from "@/components/evaluation/HumanRatingForm";
import { ProfileInputSummary } from "@/components/evaluation/ProfileInputSummary";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Spinner } from "@/components/ui/Spinner";
import { useEvaluation } from "@/hooks/useEvaluation";

export default function EvaluationPage() {
  const {
    profiles,
    selectedKey,
    selectedProfile,
    setSelectedKey,
    result,
    summary,
    loadingProfiles,
    loading,
    summaryLoading,
    savingPreference,
    profilesError,
    runError,
    summaryError,
    ratingError,
    loadProfiles,
    run,
    saveHumanPreference
  } = useEvaluation();

  const hasProfiles = profiles.length > 0;

  return (
    <AppShell>
      <PageHeader eyebrow="Evaluation" title="Evaluation: Baseline vs SalesCompass Agent">
        We compare SalesCompass against a naive baseline that picks the broadest or most obvious segment from the input.
      </PageHeader>

      <div className="grid gap-5">
        <Card>
          <div className="grid gap-3 md:grid-cols-2">
            <MetricNote title="Metric 1" value="Confidence behavior on thin-data cases." />
            <MetricNote title="Metric 2" value="Human preference between baseline and agent recommendations." />
          </div>
        </Card>

        <EvaluationSummary summary={summary} loading={summaryLoading} error={summaryError} />

        {loadingProfiles ? <Spinner label="Loading evaluation profiles" /> : null}

        {profilesError ? (
          <div className="grid gap-3">
            <ErrorMessage message={profilesError} />
            <div>
              <Button
                type="button"
                variant="secondary"
                onClick={loadProfiles}
                icon={<RefreshCw aria-hidden className="h-4 w-4" />}
              >
                Retry loading profiles
              </Button>
            </div>
          </div>
        ) : null}

        {!loadingProfiles && !profilesError && !hasProfiles ? (
          <EmptyState title="No evaluation profiles found">
            Seeded profiles are required before the baseline-vs-agent evaluation can run.
          </EmptyState>
        ) : null}

        {hasProfiles ? (
          <>
            <EvaluationProfilePicker
              profiles={profiles}
              selectedKey={selectedKey}
              onChange={setSelectedKey}
            />

            <ProfileInputSummary profile={selectedProfile} />

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={run}
                disabled={loading || loadingProfiles || !selectedProfile}
                icon={<Play aria-hidden className="h-4 w-4" />}
              >
                {loading ? "Running..." : "Run Baseline vs Agent"}
              </Button>
              {loading ? (
                <span className="text-sm text-neutral-600">Running baseline vs agent...</span>
              ) : null}
            </div>
          </>
        ) : null}

        <ErrorMessage message={runError} />

        {!result && hasProfiles && !loading ? (
          <EmptyState title="No evaluation run yet">
            Select a profile and run the evaluation to compare the baseline against SalesCompass.
          </EmptyState>
        ) : null}

        {result ? (
          <>
            <BaselineVsAgent result={result} />
            <ConfidenceMetricCard result={result} />
            <HumanRatingForm
              resultId={result.resultId}
              currentPreference={result.humanPreference}
              currentNotes={result.humanPreference ? result.notes : ""}
              isSubmitting={savingPreference}
              error={ratingError}
              onSubmit={saveHumanPreference}
            />
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

function MetricNote({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md bg-field px-3 py-3">
      <div className="text-xs font-semibold uppercase text-neutral-500">{title}</div>
      <p className="mt-1 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
