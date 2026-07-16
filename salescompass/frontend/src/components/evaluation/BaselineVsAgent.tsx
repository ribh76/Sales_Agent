import { Bot, ListTree } from "lucide-react";
import type { EvaluationResultView } from "@/types/evaluation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ConfidenceBadge } from "@/components/results/ConfidenceBadge";

export function BaselineVsAgent({ result }: { result: EvaluationResultView }) {
  const baseline = result.baseline;
  const agent = result.agentViewModel;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <ListTree aria-hidden className="h-5 w-5 text-amber-600" />
            <h2 className="text-base font-semibold">Naive Baseline</h2>
          </div>
          <ConfidenceBadge value={baseline.confidence} />
        </div>

        <div className="mt-4 grid gap-4">
          <Detail label="Selected segment" value={baseline.segment} strong />
          <Detail label="ICP" value={baseline.icp} />
          <Detail label="Rationale" value={baseline.rationale} />
          <OutreachDetail
            channel={baseline.outreachChannel}
            message={baseline.outreachMessage}
          />
        </div>
      </Card>

      <Card className="border-signal/30">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bot aria-hidden className="h-5 w-5 text-signal" />
            <h2 className="text-base font-semibold">SalesCompass Agent</h2>
          </div>
          <ConfidenceBadge value={agent.recommendedICP.confidence} />
        </div>

        <div className="mt-4 grid gap-4">
          <Detail label="Recommended ICP profile" value={agent.recommendedICP.profile} strong />
          <div className="grid gap-3 sm:grid-cols-2">
            <Detail label="Target industry" value={agent.recommendedICP.industry} compact />
            <Detail label="Company size" value={agent.recommendedICP.companySize} compact />
            <Detail label="Decision-maker" value={agent.recommendedICP.decisionMaker} compact />
            <Detail label="Main pain point" value={agent.recommendedICP.painPoint} compact />
          </div>
          <Detail label="Rationale" value={agent.recommendedICP.rationale} />
          <OutreachDetail
            channel={agent.outreach.channel}
            message={agent.outreach.sampleMessage}
            detail={agent.outreach.trigger}
          />
        </div>
      </Card>
    </div>
  );
}

function Detail({
  label,
  value,
  strong = false,
  compact = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "rounded-md bg-field px-3 py-2" : ""}>
      <div className="text-xs font-semibold uppercase text-neutral-500">{label}</div>
      <p
        className={`mt-1 leading-6 ${
          strong ? "text-lg font-semibold text-ink" : "text-sm text-neutral-700"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function OutreachDetail({
  channel,
  message,
  detail,
}: {
  channel: string;
  message: string;
  detail?: string;
}) {
  return (
    <div className="rounded-md bg-field p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase text-neutral-500">Outreach</div>
        <Badge tone="neutral">{channel}</Badge>
      </div>
      {detail ? <p className="mt-2 text-xs font-medium text-neutral-500">{detail}</p> : null}
      <p className="mt-3 text-sm leading-6 text-neutral-700">{message}</p>
    </div>
  );
}
