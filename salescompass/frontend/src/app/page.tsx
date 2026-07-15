import Image from "next/image";
import Link from "next/link";
import { BarChart3, Compass, Play } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-field text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <Image src="/logo.svg" alt="" width={36} height={36} priority />
            <span>SalesCompass</span>
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/login" className="text-neutral-600 hover:text-signal">
              Sign in
            </Link>
            <Link href="/register" className="text-signal hover:text-ink">
              Register
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-8 py-16 lg:grid-cols-[1fr_0.75fr]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-sm font-medium text-neutral-700 shadow-panel">
              <Compass aria-hidden className="h-4 w-4 text-signal" />
              ICP analysis for focused sales decisions
            </div>
            <h1 className="mt-6 text-5xl font-semibold leading-tight text-ink sm:text-6xl">
              SalesCompass
            </h1>
            <p className="mt-5 max-w-2xl text-xl leading-8 text-neutral-700">
              Turn company context and customer evidence into a ranked ICP, outreach strategy, and action plan.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/analyze"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-medium text-white transition hover:bg-signal"
              >
                <Play aria-hidden className="h-4 w-4" />
                Start Analysis
              </Link>
              <Link
                href="/evaluation"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-medium text-ink transition hover:border-signal hover:text-signal"
              >
                <BarChart3 aria-hidden className="h-4 w-4" />
                View Evaluation Demo
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-line bg-white p-5 shadow-panel">
            <div className="text-sm font-semibold text-neutral-500">Latest run preview</div>
            <div className="mt-4 grid gap-3">
              {[
                ["Mode", "History-backed"],
                ["Top segment", "Revenue teams at scaling B2B SaaS companies"],
                ["Confidence", "86%"],
                ["Next step", "Validate the trigger event with five prospects"]
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-field px-3 py-3">
                  <div className="text-xs font-semibold uppercase text-neutral-500">{label}</div>
                  <div className="mt-1 text-sm font-medium text-ink">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
