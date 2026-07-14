import Link from "next/link";
import { ArrowRight, BarChart3, Sparkles, Target } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function DashboardPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Workspace"
        title="ICP command center"
        action={
          <Link href="/analyze">
            <Button icon={<Sparkles aria-hidden className="h-4 w-4" />}>New analysis</Button>
          </Link>
        }
      >
        Focus the next sales motion around a segment with urgency, reachable buyers, and a measurable pain.
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <Target aria-hidden className="h-5 w-5 text-signal" />
          <h2 className="mt-3 text-base font-semibold">Current focus</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-700">
            Revenue teams at scaling B2B SaaS companies with onboarding and pipeline quality pressure.
          </p>
          <Badge tone="green" className="mt-4">
            High fit
          </Badge>
        </Card>
        <Card>
          <BarChart3 aria-hidden className="h-5 w-5 text-caution" />
          <h2 className="mt-3 text-base font-semibold">Evaluation</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-700">
            Compare the agent against a generic baseline and review specificity, evidence, and actionability.
          </p>
          <Link href="/evaluation" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-signal">
            Open evaluation
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </Card>
        <Card>
          <Sparkles aria-hidden className="h-5 w-5 text-coral" />
          <h2 className="mt-3 text-base font-semibold">Next analysis</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-700">
            Add product context, buyer signals, and customer history to produce a ranked ICP recommendation.
          </p>
          <Link href="/analyze" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-signal">
            Start
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </Card>
      </div>
    </AppShell>
  );
}

