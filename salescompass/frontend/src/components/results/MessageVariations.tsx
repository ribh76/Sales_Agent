import type { OutreachVariation } from "@/types/analysis";
import { OutreachCard } from "./OutreachCard";

export function MessageVariations({ outreach }: { outreach: OutreachVariation[] }) {
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold">Message variations</h2>
      <div className="grid gap-3 lg:grid-cols-3">
        {outreach.map((item) => (
          <OutreachCard key={`${item.channel}-${item.title}`} outreach={item} />
        ))}
      </div>
    </section>
  );
}

