import { ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ActionPlanCard } from "@/components/results/ActionPlanCard";
import { BaselineComparisonCard } from "@/components/results/BaselineComparisonCard";
import { DiagnosisCard } from "@/components/results/DiagnosisCard";
import { ExternalBenchmarksCard } from "@/components/results/ExternalBenchmarksCard";
import { ICPCard } from "@/components/results/ICPCard";
import { MarketScoresChart } from "@/components/results/MarketScoresChart";
import { MessageVariations } from "@/components/results/MessageVariations";
import { SegmentScoreCard } from "@/components/results/SegmentScoreCard";
import staticDemo from "@/data/staticDemoAnalysis.json";
import { adaptAnalysisRun } from "@/lib/analysisAdapter";
import type { AnalysisRunApi } from "@/types/analysis";

const demoRun = adaptAnalysisRun(staticDemo.run as AnalysisRunApi);

export default function DemoPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Static demo"
        title="Backend-free analysis flow"
        action={<Badge tone="green">No API required</Badge>}
      >
        A hardcoded insurance path that uses static JSON when the backend is unavailable.
      </PageHeader>

      <div className="grid gap-5">
        <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Static intake</h2>
              <p className="mt-1 text-sm text-neutral-600">
                History mode, completed intake, and pre-rendered result from static JSON.
              </p>
            </div>
            <ShieldCheck aria-hidden className="h-5 w-5 text-signal" />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Snapshot label="Company" value={staticDemo.company.name} />
            <Snapshot label="Mode" value="History" />
            <Snapshot label="Industry" value={staticDemo.company.industry} />
            <Snapshot label="Stage" value={staticDemo.company.stage} />
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1fr_0.75fr]">
          <DiagnosisCard diagnosis={demoRun.diagnosis} confidence={demoRun.recommendedICP.confidence} />
          <ICPCard icp={demoRun.recommendedICP} />
        </div>

        <section>
          <h2 className="mb-3 text-base font-semibold">Top Candidate Segments</h2>
          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <MarketScoresChart segments={demoRun.markets} />
            <div className="grid gap-3">
              {demoRun.markets.map((segment) => (
                <SegmentScoreCard key={segment.name} segment={segment} />
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <ExternalBenchmarksCard benchmarks={demoRun.benchmarks} />
          <ActionPlanCard
            summary={demoRun.actionPlan?.summary}
            steps={demoRun.actionPlan?.nextSteps ?? []}
            messageVariations={demoRun.actionPlan?.messageVariations}
            metrics={demoRun.actionPlan?.metricsToTrack}
          />
        </div>

        <MessageVariations
          outreach={demoRun.outreach}
          variations={demoRun.actionPlan?.messageVariations}
        />

        <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
          <h2 className="text-base font-semibold">Human Checkpoint</h2>
          <p className="mt-3 text-sm leading-6 text-neutral-700">
            {demoRun.questionsForHuman[0] ?? demoRun.recommendedICP.confidenceBasis}
          </p>
        </section>

        <BaselineComparisonCard baseline={demoRun.baseline} recommendedICP={demoRun.recommendedICP.profile} />
      </div>
    </AppShell>
  );
}

function Snapshot({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-field px-3 py-3">
      <div className="text-xs font-semibold uppercase text-neutral-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-ink">{value}</div>
    </div>
  );
}
