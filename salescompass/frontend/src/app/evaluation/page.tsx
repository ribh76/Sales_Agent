"use client";

import { Play } from "lucide-react";
import { BaselineVsAgent } from "@/components/evaluation/BaselineVsAgent";
import { EvaluationProfilePicker } from "@/components/evaluation/EvaluationProfilePicker";
import { EvaluationSummary } from "@/components/evaluation/EvaluationSummary";
import { HumanRatingForm } from "@/components/evaluation/HumanRatingForm";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Spinner } from "@/components/ui/Spinner";
import { useEvaluation } from "@/hooks/useEvaluation";

export default function EvaluationPage() {
  const { profiles, selectedKey, setSelectedKey, result, loading, error, run } = useEvaluation();

  return (
    <AppShell>
      <PageHeader eyebrow="Evaluation" title="Baseline vs agent">
        Compare broad industry-stage advice against the focused ICP analysis.
      </PageHeader>

      <div className="grid gap-5">
        <div className="rounded-lg border border-line bg-white p-5 shadow-panel">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <EvaluationProfilePicker
              profiles={profiles}
              selectedKey={selectedKey}
              onChange={setSelectedKey}
            />
            <Button type="button" onClick={run} disabled={loading} icon={<Play aria-hidden className="h-4 w-4" />}>
              {loading ? "Running" : "Run evaluation"}
            </Button>
          </div>
        </div>

        {loading ? <Spinner label="Scoring outputs" /> : null}
        <ErrorMessage message={error} />
        {result ? (
          <>
            <EvaluationSummary result={result} />
            <BaselineVsAgent result={result} />
            <HumanRatingForm />
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

