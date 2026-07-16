"use client";

import { useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import type { AnalysisRunApi, AnalysisViewModel, ReviewStatus } from "@/types/analysis";
import { approveAnalysis, refineAnalysis } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Spinner } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/Textarea";

export function HumanCheckpoint({
  runId,
  prompt,
  questions = [],
  hypotheses = [],
  reviewStatus,
  onRefresh,
  onRunUpdated
}: {
  runId: number;
  prompt: string;
  questions?: string[];
  hypotheses?: string[];
  reviewStatus: ReviewStatus;
  onRefresh: () => Promise<AnalysisViewModel | null>;
  onRunUpdated: (apiRun: AnalysisRunApi) => AnalysisViewModel;
}) {
  const [refinementText, setRefinementText] = useState("");
  const [approving, setApproving] = useState(false);
  const [refining, setRefining] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isApproved = reviewStatus === "approved";

  async function onApprove() {
    setApproving(true);
    setError(null);
    setMessage(null);
    try {
      const updatedRun = await approveAnalysis(runId);
      onRunUpdated(updatedRun);
      setMessage("Recommendation approved. Action plan generation is unlocked.");
    } catch {
      setError("We could not save approval yet. The recommendation is still available.");
    } finally {
      setApproving(false);
    }
  }

  async function onRequestRefinement() {
    const notes = refinementText.trim();
    if (!notes) {
      setError("Add a short refinement note before submitting.");
      return;
    }

    setRefining(true);
    setError(null);
    setMessage(null);
    try {
      await refineAnalysis(runId, notes);
      await onRefresh();
      setRefinementText("");
      setMessage("Recommendation updated. Review the refreshed ICP above.");
    } catch {
      setError(
        "We could not apply that refinement. Your current recommendation is still here."
      );
    } finally {
      setRefining(false);
    }
  }

  return (
    <Card className={isApproved ? "border-signal/40" : ""}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Human Checkpoint</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-700">{prompt}</p>
        </div>
        {isApproved ? (
          <span className="inline-flex h-8 items-center gap-2 rounded-full bg-teal-50 px-3 text-xs font-semibold text-teal-800 ring-1 ring-teal-200">
            <CheckCircle2 aria-hidden className="h-4 w-4" />
            Approved
          </span>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ValidationList
          title="Questions for human"
          items={questions}
          emptyMessage="No human questions were returned. Use refinement if the decision needs clearer buyer, market, or evidence checks."
        />
        <ValidationList
          title="Hypotheses to validate"
          items={hypotheses}
          emptyMessage="No validation hypotheses were returned. Add a refinement note asking for the riskiest assumptions to test before scaling."
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-md border border-line bg-white px-3 py-3">
          <h3 className="text-sm font-semibold text-ink">Approve recommendation</h3>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Lock in this ICP and move the workflow toward action-plan generation.
          </p>
          <Button
            type="button"
            className="mt-3"
            disabled={approving || refining || isApproved}
            onClick={onApprove}
            icon={
              approving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <CheckCircle2 aria-hidden className="h-4 w-4" />
              )
            }
          >
            {isApproved ? "Approved" : approving ? "Approving" : "Approve"}
          </Button>
        </div>

        <div className="rounded-md border border-line bg-white px-3 py-3">
          <h3 className="text-sm font-semibold text-ink">Request refinement</h3>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Tell SalesCompass what to adjust. If refinement fails, this result stays visible.
          </p>
          <div className="mt-3">
            <Textarea
              label="Refinement note"
              value={refinementText}
              disabled={refining || approving}
              onChange={(event) => setRefinementText(event.target.value)}
              placeholder="Example: Focus on healthcare operators and de-emphasize finance buyers."
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={refining || approving}
              onClick={onRequestRefinement}
              icon={
                refining ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-signal/30 border-t-signal" />
                ) : (
                  <RotateCcw aria-hidden className="h-4 w-4" />
                )
              }
            >
              {refining ? "Refining" : "Request refinement"}
            </Button>
            {refining ? <Spinner label="Updating recommendation" /> : null}
          </div>
        </div>
      </div>
      {message ? (
        <div className="mt-4 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
          {message}
        </div>
      ) : null}
      <div className="mt-4">
        <ErrorMessage message={error} />
      </div>
    </Card>
  );
}

function ValidationList({
  title,
  items,
  emptyMessage
}: {
  title: string;
  items: string[];
  emptyMessage: string;
}) {
  return (
    <div className="rounded-md bg-field px-3 py-3">
      <h3 className="text-xs font-semibold uppercase text-neutral-500">{title}</h3>
      <ul className="mt-2 grid gap-2 text-sm text-neutral-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
        {items.length === 0 ? <li>{emptyMessage}</li> : null}
      </ul>
    </div>
  );
}
