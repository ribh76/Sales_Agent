"use client";

import { useEffect, useState } from "react";
import type { HumanPreference } from "@/types/evaluation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

export function HumanRatingForm({
  resultId,
  currentPreference,
  saving,
  onSave
}: {
  resultId: number;
  currentPreference: HumanPreference | null;
  saving: boolean;
  onSave: (preference: HumanPreference, notes?: string) => Promise<void>;
}) {
  const [preference, setPreference] = useState<HumanPreference>(currentPreference ?? "agent");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPreference(currentPreference ?? "agent");
    setNotes("");
    setSaved(false);
    setError(null);
  }, [resultId, currentPreference]);

  async function savePreference() {
    setError(null);
    setSaved(false);
    try {
      await onSave(preference, notes);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save preference.");
    }
  }

  return (
    <Card>
      <h2 className="text-base font-semibold">Human preference form</h2>
      <div className="mt-4 grid gap-3">
        <Select
          label="Preferred output"
          value={preference}
          onChange={(event) => setPreference(event.target.value as HumanPreference)}
          options={[
            { value: "agent", label: "Agent" },
            { value: "baseline", label: "Baseline" },
            { value: "tie", label: "Tie" }
          ]}
        />
        <Textarea label="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
        <ErrorMessage message={error} />
        <div className="flex items-center gap-3">
          <Button type="button" onClick={savePreference} disabled={saving}>
            {saving ? "Saving" : "Save preference"}
          </Button>
          {saved ? <span className="text-sm text-signal">Preference saved.</span> : null}
        </div>
      </div>
    </Card>
  );
}
