import { Target } from "lucide-react";
import type { RecommendedICPView } from "@/types/analysis";
import { Card } from "@/components/ui/Card";
import { ConfidenceBadge } from "./ConfidenceBadge";

export function ICPCard({
  icp,
  hypotheses
}: {
  icp: RecommendedICPView;
  hypotheses: string[];
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target aria-hidden className="h-5 w-5 text-signal" />
          <h2 className="text-base font-semibold">Recommended ICP</h2>
        </div>
        <ConfidenceBadge value={icp.confidence} />
      </div>
      <p className="mt-3 text-lg font-semibold leading-7 text-ink">{icp.profile}</p>
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
      {hypotheses.length > 0 ? (
        <ul className="mt-4 grid gap-2 text-sm text-neutral-700">
          {hypotheses.map((item) => (
            <li key={item} className="rounded-md bg-field px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      ) : null}
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
