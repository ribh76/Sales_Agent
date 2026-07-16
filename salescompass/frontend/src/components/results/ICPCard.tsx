import { Target } from "lucide-react";
import type { RecommendedICPView } from "@/types/analysis";
import { Card } from "@/components/ui/Card";
import { ConfidenceBadge } from "./ConfidenceBadge";

export function ICPCard({
  icp,
  diagnosis
}: {
  icp: RecommendedICPView;
  diagnosis?: string;
}) {
  return (
    <Card className="border-signal/30">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target aria-hidden className="h-5 w-5 text-signal" />
          <h2 className="text-base font-semibold">Recommended ICP</h2>
        </div>
        <ConfidenceBadge value={icp.confidence} />
      </div>
      <p className="mt-3 text-xl font-semibold leading-8 text-ink">{icp.profile}</p>
      {diagnosis ? (
        <p className="mt-3 rounded-md bg-teal-50 px-3 py-3 text-sm leading-6 text-teal-950">
          {diagnosis}
        </p>
      ) : null}
      <div className="mt-4 grid gap-3 text-sm text-neutral-700 sm:grid-cols-2">
        <Detail label="Industry" value={icp.industry} />
        <Detail label="Company size" value={icp.companySize} />
        <Detail label="Region" value={icp.region} />
        <Detail label="Decision-maker" value={icp.decisionMaker} />
      </div>
      <div className="mt-4 rounded-md bg-field px-3 py-3 text-sm leading-6 text-neutral-700">
        <div className="font-medium text-ink">{icp.painPoint}</div>
        <p className="mt-1">{icp.rationale}</p>
        <p className="mt-2 text-neutral-600">{icp.confidenceBasis}</p>
      </div>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-field px-3 py-2">
      <div className="text-xs font-semibold uppercase text-neutral-500">{label}</div>
      <div className="mt-1 font-medium text-ink">{value}</div>
    </div>
  );
}
