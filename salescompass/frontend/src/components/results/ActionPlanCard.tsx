import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function ActionPlanCard({
  steps,
  metrics = []
}: {
  steps: string[];
  metrics?: string[];
}) {
  return (
    <Card>
      <h2 className="text-base font-semibold">Action Plan</h2>
      <div className="mt-4 grid gap-3">
        {steps.map((step, index) => (
          <div key={step} className="flex gap-3">
            <CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-signal" />
            <div>
              <div className="text-xs font-semibold uppercase text-neutral-500">
                Step {index + 1}
              </div>
              <p className="text-sm text-neutral-700">{step}</p>
            </div>
          </div>
        ))}
        {steps.length === 0 ? (
          <p className="text-sm text-neutral-600">No action plan steps returned yet.</p>
        ) : null}
      </div>
      {metrics.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-xs font-semibold uppercase text-neutral-500">Metrics to track</h3>
          <ul className="mt-2 grid gap-2 text-sm text-neutral-700">
            {metrics.map((metric) => (
              <li key={metric} className="rounded-md bg-field px-3 py-2">
                {metric}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
