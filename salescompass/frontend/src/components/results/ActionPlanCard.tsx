import { CheckCircle2, Sparkles } from "lucide-react";
import type { ActionMessageVariationView, ActionPlanStepView } from "@/types/analysis";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Spinner } from "@/components/ui/Spinner";

export function ActionPlanCard({
  summary,
  steps,
  messageVariations = [],
  metrics = [],
  canGenerate = false,
  generating = false,
  generationError,
  generationMessage,
  onGenerate
}: {
  summary?: string;
  steps: ActionPlanStepView[];
  messageVariations?: ActionMessageVariationView[];
  metrics?: string[];
  canGenerate?: boolean;
  generating?: boolean;
  generationError?: string | null;
  generationMessage?: string | null;
  onGenerate?: () => void;
}) {
  const hasActionPlan = steps.length > 0 || messageVariations.length > 0 || metrics.length > 0;
  const state = generating ? "generating" : hasActionPlan ? "ready" : "empty";

  return (
    <Card className={state === "empty" && canGenerate ? "border-signal/40 bg-teal-50/30" : ""}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Action Plan</h2>
          {state !== "ready" ? (
            <p className="mt-1 text-sm text-neutral-600">
              {canGenerate
                ? "Turn the approved ICP into a practical GTM checklist."
                : "Approve the recommendation in Human Checkpoint to unlock action-plan generation."}
            </p>
          ) : null}
        </div>
        {onGenerate ? (
          <Button
            type="button"
            size="sm"
            disabled={!canGenerate || generating}
            onClick={onGenerate}
            icon={
              generating ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Sparkles aria-hidden className="h-4 w-4" />
              )
            }
          >
            {generating ? "Generating" : hasActionPlan ? "Regenerate plan" : "Generate plan"}
          </Button>
        ) : null}
      </div>
      {generationMessage ? (
        <div className="mt-3 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
          {generationMessage}
        </div>
      ) : null}
      <div className="mt-3">
        <ErrorMessage message={generationError} />
      </div>

      {state === "empty" ? <EmptyActionPlan canGenerate={canGenerate} /> : null}
      {state === "generating" ? <GeneratingActionPlan /> : null}
      {state === "ready" ? (
        <ReadyActionPlan
          summary={summary}
          steps={steps}
          messageVariations={messageVariations}
          metrics={metrics}
        />
      ) : null}
    </Card>
  );
}

function EmptyActionPlan({ canGenerate }: { canGenerate: boolean }) {
  return (
    <div className="mt-4 flex min-h-32 items-center rounded-md border border-dashed border-line bg-white px-4 py-5">
      <p className="max-w-2xl text-sm leading-6 text-neutral-700">
        {canGenerate
          ? "No action plan has been generated yet. Create one to turn the recommendation into steps, message tests, and metrics for the next GTM sprint."
          : "No action plan has been generated yet. Approve the ICP first, then generate the GTM checklist."}
      </p>
    </div>
  );
}

function GeneratingActionPlan() {
  return (
    <div className="mt-4 min-h-32 rounded-md border border-line bg-white px-4 py-5">
      <Spinner label="Building GTM checklist" />
      <div className="mt-4 grid gap-2">
        <div className="h-3 w-3/4 rounded-full bg-field" />
        <div className="h-3 w-2/3 rounded-full bg-field" />
        <div className="h-3 w-1/2 rounded-full bg-field" />
      </div>
    </div>
  );
}

function ReadyActionPlan({
  summary,
  steps,
  messageVariations,
  metrics
}: {
  summary?: string;
  steps: ActionPlanStepView[];
  messageVariations: ActionMessageVariationView[];
  metrics: string[];
}) {
  return (
    <div className="mt-4 grid gap-5">
      {summary ? (
        <p className="rounded-md bg-field px-3 py-3 text-sm leading-6 text-neutral-700">
          {summary}
        </p>
      ) : null}

      <section>
        <h3 className="text-xs font-semibold uppercase text-neutral-500">Next steps</h3>
        <div className="mt-3 grid gap-3">
          {steps.map((step, index) => (
            <div key={`${step.title}-${index}`} className="rounded-md border border-line bg-white px-3 py-3">
              <div className="flex gap-3">
                <CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-signal" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase text-neutral-500">
                    Step {index + 1}
                  </div>
                  <p className="mt-1 text-sm font-medium leading-6 text-ink">{step.title}</p>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-neutral-600 sm:grid-cols-3">
                <Detail label="Owner" value={step.owner} />
                <Detail label="Timeframe" value={step.timeframe} />
                <Detail label="Success metric" value={step.successMetric} />
              </div>
            </div>
          ))}
          {steps.length === 0 ? (
            <p className="rounded-md bg-field px-3 py-2 text-sm text-neutral-600">
              No next steps were returned. Regenerate the plan after approval to request a concrete
              execution checklist.
            </p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h3 className="text-xs font-semibold uppercase text-neutral-500">Message variations</h3>
          <div className="mt-3 grid gap-3">
            {messageVariations.map((variation, index) => (
              <div key={`${variation.title}-${index}`} className="rounded-md bg-field px-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{variation.title}</p>
                  <span className="text-xs font-semibold uppercase text-neutral-500">
                    {variation.channel}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-neutral-700">{variation.message}</p>
              </div>
            ))}
            {messageVariations.length === 0 ? (
              <p className="rounded-md bg-field px-3 py-2 text-sm text-neutral-600">
                No message variations were returned. Regenerate the plan to request outreach tests
                for email, LinkedIn, or call follow-up.
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase text-neutral-500">Metrics to track</h3>
          <ul className="mt-3 grid gap-2 text-sm text-neutral-700">
            {metrics.map((metric) => (
              <li key={metric} className="rounded-md bg-field px-3 py-2">
                {metric}
              </li>
            ))}
            {metrics.length === 0 ? (
              <li className="rounded-md bg-field px-3 py-2">
                No metrics were returned. Track reply rate, qualified meetings, conversion rate,
                and sales-cycle movement until a tailored metric list is generated.
              </li>
            ) : null}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-md bg-field px-2 py-2">
      <div className="font-semibold uppercase text-neutral-500">{label}</div>
      <div className="mt-1 text-neutral-800">{value ?? "Unassigned"}</div>
    </div>
  );
}
