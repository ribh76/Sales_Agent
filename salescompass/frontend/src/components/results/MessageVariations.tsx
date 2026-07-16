import type { ActionMessageVariationView, OutreachView } from "@/types/analysis";
import { OutreachCard } from "./OutreachCard";

export function MessageVariations({
  outreach,
  variations = []
}: {
  outreach: OutreachView;
  variations?: ActionMessageVariationView[];
}) {
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold">Outreach Strategy</h2>
      <div className="grid gap-3 lg:grid-cols-3">
        <OutreachCard
          title="Primary message"
          channel={outreach.channel}
          detail={`${outreach.firstContact} / ${outreach.tone}`}
          message={outreach.sampleMessage}
        />
        <OutreachCard
          title="Trigger"
          channel={outreach.channel}
          detail={`${outreach.confidence} confidence`}
          message={`${outreach.trigger} ${outreach.confidenceBasis}`}
        />
        {variations.length > 0 ? (
          variations.map((variation, index) => (
            <OutreachCard
              key={`${variation.title}-${index}`}
              title={variation.title}
              channel={variation.channel}
              message={variation.message}
            />
          ))
        ) : (
          <OutreachCard
            title="Follow-up"
            channel={outreach.channel}
            message="Use the primary message as the first test, then vary the pain metric and proof point after early replies."
          />
        )}
      </div>
    </section>
  );
}
