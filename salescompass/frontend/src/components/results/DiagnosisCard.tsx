import { Card } from "@/components/ui/Card";
import { ConfidenceBadge } from "./ConfidenceBadge";

export function DiagnosisCard({ diagnosis, confidence }: { diagnosis: string; confidence: number }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-base font-semibold">Diagnosis</h2>
        <ConfidenceBadge value={confidence} />
      </div>
      <p className="mt-3 text-sm leading-6 text-neutral-700">{diagnosis}</p>
    </Card>
  );
}

