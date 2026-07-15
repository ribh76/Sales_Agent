import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function OutreachCard({
  title,
  channel,
  message,
  detail
}: {
  title: string;
  channel: string;
  message: string;
  detail?: string;
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Badge tone="neutral">{channel}</Badge>
      </div>
      {detail ? <p className="mt-3 text-xs font-medium uppercase text-neutral-500">{detail}</p> : null}
      <p className="mt-3 text-sm leading-6 text-neutral-700">{message}</p>
    </Card>
  );
}
