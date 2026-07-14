import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { demoProfiles } from "@/data/demoProfiles";

export default function DemoPage() {
  return (
    <AppShell>
      <PageHeader eyebrow="Demo" title="Demo profiles">
        Use these profiles to show the history and no-history paths.
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-2">
        {demoProfiles.map((profile) => (
          <Card key={profile.key}>
            <h2 className="text-base font-semibold">{profile.label}</h2>
            <p className="mt-2 text-sm text-neutral-600">{profile.company.industry}</p>
            <p className="mt-3 text-sm leading-6 text-neutral-700">{profile.company.description}</p>
            <Link href="/analyze" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-signal">
              Analyze
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
