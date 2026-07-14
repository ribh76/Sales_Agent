import { Badge } from "@/components/ui/Badge";

export function ConfidenceBadge({ value }: { value: number }) {
  const tone = value >= 75 ? "green" : value >= 55 ? "amber" : "red";
  return <Badge tone={tone}>{value}% confidence</Badge>;
}

