import { Card } from "@/components/ui/Card";

export function ConfidenceMetricCard({
  label,
  value,
  max = 5
}: {
  label: string;
  value: number;
  max?: number;
}) {
  return (
    <Card>
      <div className="text-sm font-medium text-neutral-600">{label}</div>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-3xl font-semibold text-ink">{value}</span>
        <span className="pb-1 text-sm text-neutral-500">/ {max}</span>
      </div>
    </Card>
  );
}

