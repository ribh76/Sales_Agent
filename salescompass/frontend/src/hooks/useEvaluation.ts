"use client";

import { useEffect, useState } from "react";
import { listEvaluationProfiles, runEvaluation } from "@/lib/api";
import type { EvaluationProfile, EvaluationResult } from "@/types/evaluation";

export function useEvaluation() {
  const [profiles, setProfiles] = useState<EvaluationProfile[]>([]);
  const [selectedKey, setSelectedKey] = useState("northstar-enablement");
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listEvaluationProfiles()
      .then((items) => {
        setProfiles(items);
        if (items[0]) {
          setSelectedKey(items[0].key);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load profiles."));
  }, []);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const evaluation = await runEvaluation(selectedKey);
      setResult(evaluation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed.");
    } finally {
      setLoading(false);
    }
  }

  return { profiles, selectedKey, setSelectedKey, result, loading, error, run };
}

