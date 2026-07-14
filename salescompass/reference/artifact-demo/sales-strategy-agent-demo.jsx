import React, { useMemo, useState } from "react";

const segments = [
  { name: "Revenue enablement teams", score: 91 },
  { name: "Founder-led B2B SaaS", score: 82 },
  { name: "Customer success leaders", score: 71 },
];

export default function SalesStrategyAgentDemo() {
  const [company, setCompany] = useState("Northstar Enablement");
  const topSegment = useMemo(() => segments[0], []);

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <section className="mx-auto max-w-4xl space-y-6">
        <input
          className="w-full rounded border border-slate-700 bg-slate-900 p-3"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
        />
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
          <p className="text-sm uppercase tracking-wide text-cyan-300">Recommended ICP</p>
          <h1 className="mt-2 text-3xl font-semibold">{topSegment.name}</h1>
          <p className="mt-3 text-slate-300">
            {company} should focus on teams with urgent onboarding and pipeline conversion pain.
          </p>
        </div>
        <div className="grid gap-3">
          {segments.map((segment) => (
            <div key={segment.name} className="rounded border border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <span>{segment.name}</span>
                <strong>{segment.score}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

