"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { submitFeedback } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

export function HumanCheckpoint({ runId, prompt }: { runId: number; prompt: string }) {
  const [rating, setRating] = useState("4");
  const [confidence, setConfidence] = useState("4");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setMessage(null);
    try {
      await submitFeedback({
        run_id: runId,
        rating: Number(rating),
        confidence: Number(confidence),
        notes
      });
      setMessage("Feedback saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save feedback.");
    }
  }

  return (
    <Card>
      <h2 className="text-base font-semibold">Human checkpoint</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-700">{prompt}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Select
          label="Usefulness"
          value={rating}
          onChange={(event) => setRating(event.target.value)}
          options={scoreOptions}
        />
        <Select
          label="Confidence"
          value={confidence}
          onChange={(event) => setConfidence(event.target.value)}
          options={scoreOptions}
        />
      </div>
      <div className="mt-3">
        <Textarea label="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button type="button" onClick={onSubmit} icon={<Send aria-hidden className="h-4 w-4" />}>
          Save feedback
        </Button>
        {message ? <span className="text-sm text-signal">{message}</span> : null}
      </div>
      <div className="mt-3">
        <ErrorMessage message={error} />
      </div>
    </Card>
  );
}

const scoreOptions = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" }
];

