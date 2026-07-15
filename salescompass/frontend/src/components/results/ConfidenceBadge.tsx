import type { ConfidenceLevel } from "@/types/analysis";
import { Badge } from "@/components/ui/Badge";

type ConfidenceValue = ConfidenceLevel | number | string | null | undefined;

export function ConfidenceBadge({ value }: { value: ConfidenceValue }) {
  if (typeof value === "number") {
    const tone = value >= 75 ? "green" : value >= 55 ? "amber" : "red";
    return <Badge tone={tone}>{value}% confidence</Badge>;
  }

  const confidence = normalizeConfidence(value);
  const tone = confidence === "high" ? "green" : confidence === "low" ? "red" : "amber";

  return <Badge tone={tone}>{formatConfidence(confidence)} confidence</Badge>;
}

function normalizeConfidence(value: ConfidenceValue): ConfidenceLevel {
  if (typeof value !== "string") {
    return "medium";
  }

  const normalized = value.toLowerCase().trim();
  return normalized === "low" || normalized === "medium" || normalized === "high"
    ? normalized
    : "medium";
}

function formatConfidence(value: ConfidenceLevel): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
