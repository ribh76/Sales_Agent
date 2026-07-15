"use client";

import { useEffect, useState } from "react";
import { getAnalysis } from "@/lib/api";
import { adaptAnalysisRun } from "@/lib/analysisAdapter";
import type { AnalysisViewModel } from "@/types/analysis";

export function useAnalysisResult(runId?: string) {
  const [run, setRun] = useState<AnalysisViewModel | null>(null);
  const [loading, setLoading] = useState(Boolean(runId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) {
      return;
    }
    setLoading(true);
    setError(null);
    getAnalysis(runId)
      .then((response) => setRun(adaptAnalysisRun(response)))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load run."))
      .finally(() => setLoading(false));
  }, [runId]);

  return { run, loading, error };
}
