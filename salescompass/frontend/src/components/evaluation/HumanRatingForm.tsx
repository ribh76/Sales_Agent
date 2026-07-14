"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

export function HumanRatingForm() {
  const [rating, setRating] = useState("4");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  return (
    <Card>
      <h2 className="text-base font-semibold">Reviewer rating</h2>
      <div className="mt-4 grid gap-3">
        <Select
          label="Overall score"
          value={rating}
          onChange={(event) => setRating(event.target.value)}
          options={[
            { value: "1", label: "1" },
            { value: "2", label: "2" },
            { value: "3", label: "3" },
            { value: "4", label: "4" },
            { value: "5", label: "5" }
          ]}
        />
        <Textarea label="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
        <div className="flex items-center gap-3">
          <Button type="button" onClick={() => setSaved(true)}>
            Save rating
          </Button>
          {saved ? <span className="text-sm text-signal">Rating saved locally.</span> : null}
        </div>
      </div>
    </Card>
  );
}

