import { Target } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function ICPCard({ icp, assumptions }: { icp: string; assumptions: string[] }) {
  return (
    <Card>
      <div className="flex items-center gap-2">
        <Target aria-hidden className="h-5 w-5 text-signal" />
        <h2 className="text-base font-semibold">Recommended ICP</h2>
      </div>
      <p className="mt-3 text-lg font-semibold leading-7 text-ink">{icp}</p>
      <ul className="mt-4 grid gap-2 text-sm text-neutral-700">
        {assumptions.map((item) => (
          <li key={item} className="rounded-md bg-field px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}

