import type {
  ConfidenceLevel,
  DowngradedSegmentView,
  EvidenceItemView,
  ModeEvidenceView,
} from "@/types/analysis";
import { Card } from "@/components/ui/Card";
import { ConfidenceBadge } from "./ConfidenceBadge";

export function ModeEvidenceCard({
  mode,
  evidence,
  confidence,
  confidenceBasis,
  hypotheses,
  questions,
}: {
  mode: "history" | "no_history";
  evidence: ModeEvidenceView;
  confidence: ConfidenceLevel;
  confidenceBasis: string;
  hypotheses: string[];
  questions: string[];
}) {
  return mode === "history" ? (
    <HistoryEvidenceCard evidence={evidence} />
  ) : (
    <NoHistoryEvidenceCard
      evidence={evidence}
      confidence={confidence}
      confidenceBasis={confidenceBasis}
      hypotheses={hypotheses}
      questions={questions}
    />
  );
}

function HistoryEvidenceCard({ evidence }: { evidence: ModeEvidenceView }) {
  return (
    <Card>
      <h2 className="text-base font-semibold">Sales History Evidence</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-600">
        This run is weighted toward observed sales signals: customer history, won/lost patterns,
        conversion evidence, sales-cycle evidence, and why weaker segments were downgraded.
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <EvidenceGroup title="Sales history" items={evidence.salesHistory} />
        <EvidenceGroup title="Won/lost patterns" items={evidence.wonLostPatterns} />
        <EvidenceGroup title="Conversion and sales cycle" items={evidence.conversionEvidence} />
      </div>
      <DowngradedSegments segments={evidence.downgradedSegments} />
    </Card>
  );
}

function NoHistoryEvidenceCard({
  evidence,
  confidence,
  confidenceBasis,
  hypotheses,
  questions,
}: {
  evidence: ModeEvidenceView;
  confidence: ConfidenceLevel;
  confidenceBasis: string;
  hypotheses: string[];
  questions: string[];
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">No-History Assumptions</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            This run has less direct sales evidence, so the page keeps market assumptions,
            validation hypotheses, and human questions close to the recommendation.
          </p>
        </div>
        <ConfidenceBadge value={confidence} />
      </div>
      <p className="mt-3 rounded-md bg-amber-50 px-3 py-3 text-sm leading-6 text-amber-900">
        {confidenceBasis}
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <EvidenceGroup title="Market assumptions" items={evidence.marketAssumptions} />
        <EvidenceGroup title="Demo market context" items={evidence.demoMarketContext} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <TextList
          title="Validation hypotheses"
          items={hypotheses}
          emptyMessage="No validation hypotheses were returned. Ask for the riskiest market assumptions in refinement before scaling."
        />
        <TextList
          title="Questions for the human"
          items={questions}
          emptyMessage="No human questions were returned. Add a refinement note if the next decision needs clearer checkpoints."
        />
      </div>
    </Card>
  );
}

function EvidenceGroup({ title, items }: { title: string; items: EvidenceItemView[] }) {
  return (
    <div className="rounded-md bg-field px-3 py-3">
      <h3 className="text-xs font-semibold uppercase text-neutral-500">{title}</h3>
      <div className="mt-3 grid gap-3">
        {items.map((item) => (
          <div key={`${item.label}-${item.value}`}>
            <div className="text-xs font-semibold uppercase text-neutral-500">{item.label}</div>
            <p className="mt-1 text-sm leading-6 text-neutral-700">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DowngradedSegments({ segments }: { segments: DowngradedSegmentView[] }) {
  return (
    <div className="mt-4 rounded-md bg-field px-3 py-3">
      <h3 className="text-xs font-semibold uppercase text-neutral-500">Why segments were downgraded</h3>
      <div className="mt-3 grid gap-3">
        {segments.map((segment) => (
          <div key={segment.name} className="rounded-md bg-white px-3 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink">{segment.name}</p>
              <span className="text-sm font-semibold text-neutral-600">{segment.score}/10</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-neutral-700">{segment.rationale}</p>
          </div>
        ))}
        {segments.length === 0 ? (
          <p className="text-sm leading-6 text-neutral-600">
            No downgraded segments were returned. The run may have only produced one viable segment
            or skipped comparative scoring.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function TextList({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: string[];
  emptyMessage: string;
}) {
  return (
    <div className="rounded-md bg-field px-3 py-3">
      <h3 className="text-xs font-semibold uppercase text-neutral-500">{title}</h3>
      <ul className="mt-3 grid gap-2 text-sm leading-6 text-neutral-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
        {items.length === 0 ? <li>{emptyMessage}</li> : null}
      </ul>
    </div>
  );
}
