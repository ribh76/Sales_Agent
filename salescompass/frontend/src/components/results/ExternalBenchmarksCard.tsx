import { Card } from "@/components/ui/Card";

export function ExternalBenchmarksCard({ benchmarks }: { benchmarks: string[] }) {
  return (
    <Card>
      <h2 className="text-base font-semibold">Benchmarks</h2>
      <ul className="mt-3 grid gap-2 text-sm text-neutral-700">
        {benchmarks.map((benchmark) => (
          <li key={benchmark} className="rounded-md bg-field px-3 py-2">
            {benchmark}
          </li>
        ))}
      </ul>
    </Card>
  );
}

