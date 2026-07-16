"use client";

import { useEffect, useState } from "react";
import type { HumanPreference } from "@/types/evaluation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Textarea } from "@/components/ui/Textarea";

const OPTIONS: Array<{ value: HumanPreference; label: string }> = [
  { value: "agent", label: "SalesCompass Agent" },
  { value: "baseline", label: "Naive Baseline" },
  { value: "tie", label: "Tie" },
];

export function HumanRatingForm({
  resultId,
  currentPreference,
  currentNotes,
  isSubmitting,
  error,
  onSubmit,
}: {
  resultId: number;
  currentPreference: HumanPreference | null;
  currentNotes?: string | null;
  isSubmitting: boolean;
  error?: string | null;
  onSubmit: (preference: HumanPreference, notes?: string) => Promise<void>;
}) {
  const [preference, setPreference] = useState<HumanPreference | null>(currentPreference);
  const [notes, setNotes] = useState(currentPreference ? currentNotes ?? "" : "");
  const [saved, setSaved] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setPreference(currentPreference);
    setNotes(currentPreference ? currentNotes ?? "" : "");
    setSaved(false);
    setLocalError(null);
  }, [resultId, currentPreference, currentNotes]);

  async function savePreference() {
    if (!preference) {
      return;
    }

    setLocalError(null);
    setSaved(false);
    try {
      await onSubmit(preference, notes);
      setSaved(true);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Could not save preference.");
    }
  }

  return (
    <Card>
      <h2 className="text-base font-semibold">Human Preference</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Which recommendation would you actually act on?
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {OPTIONS.map((option) => {
          const selected = preference === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setPreference(option.value);
                setSaved(false);
              }}
              className={`rounded-md border px-4 py-3 text-left text-sm font-semibold transition ${
                selected
                  ? "border-signal bg-teal-50 text-ink ring-2 ring-teal-100"
                  : "border-line bg-white text-neutral-700 hover:border-signal/50"
              }`}
              aria-pressed={selected}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3">
        <Textarea label="Why?" value={notes} onChange={(event) => setNotes(event.target.value)} />
        <ErrorMessage message={localError ?? error} />
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={savePreference}
            disabled={!preference || isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Rating"}
          </Button>
          {saved ? <span className="text-sm font-medium text-signal">Preference saved.</span> : null}
        </div>
      </div>
    </Card>
  );
}
