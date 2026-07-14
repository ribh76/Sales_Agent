import type { OutreachVariation } from "@/types/analysis";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function OutreachCard({ outreach }: { outreach: OutreachVariation }) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{outreach.title}</h3>
        <Badge tone="neutral">{outreach.channel}</Badge>
      </div>
      <p className="mt-3 text-sm leading-6 text-neutral-700">{outreach.message}</p>
    </Card>
  );
}

