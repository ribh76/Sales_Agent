import { CheckCircle2 } from "lucide-react";
import type { EvaluationProfileView } from "@/types/evaluation";
import { Badge } from "@/components/ui/Badge";

export function EvaluationProfilePicker({
  profiles,
  selectedKey,
  onChange
}: {
  profiles: EvaluationProfileView[];
  selectedKey: string;
  onChange: (value: string) => void;
}) {
  if (!profiles.length) {
    return (
      <div className="rounded-md border border-dashed border-line bg-field p-4 text-sm text-neutral-600">
        No seeded evaluation profiles are available.
      </div>
    );
  }

  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-semibold text-ink">Seed profile selector</legend>
      <div className="grid gap-3 lg:grid-cols-3">
        {profiles.map((profile) => {
          const selected = profile.id === selectedKey;

          return (
            <button
              key={profile.id}
              type="button"
              onClick={() => onChange(profile.id)}
              className={`grid min-h-44 gap-3 rounded-lg border p-4 text-left transition ${
                selected
                  ? "border-signal bg-teal-50 ring-2 ring-teal-100"
                  : "border-line bg-white hover:border-signal/50"
              }`}
              aria-pressed={selected}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-ink">{profile.name}</div>
                  <div className="mt-1 text-sm text-neutral-600">{profile.subtitle}</div>
                </div>
                {selected ? <CheckCircle2 aria-hidden className="h-5 w-5 text-signal" /> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="neutral">{profile.modeLabel}</Badge>
                <Badge tone={profile.isThinData ? "amber" : "green"}>
                  {profile.dataStrengthLabel}
                </Badge>
              </div>
              <p className="line-clamp-2 text-sm leading-6 text-neutral-700">
                {profile.shortDescription}
              </p>
              <div className="text-xs font-semibold uppercase text-neutral-500">
                Expected confidence:{" "}
                <span className="normal-case text-ink">{profile.expectedConfidenceLabel}</span>
              </div>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
