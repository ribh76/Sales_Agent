import { Badge } from "@/components/ui/Badge";

export function NoHistoryFields() {
  return (
    <div className="flex flex-wrap gap-2 rounded-md border border-line bg-field p-3">
      <Badge tone="amber">Hypothesis mode</Badge>
      <span className="text-sm text-neutral-600">
        The agent will lean on pain clarity, buyer ownership, urgency, and reachable market signals.
      </span>
    </div>
  );
}

