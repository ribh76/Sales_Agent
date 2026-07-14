"use client";

import { useEffect, useState } from "react";
import { getAnalysis } from "@/lib/api";
import type { AnalysisRun } from "@/types/analysis";

export function useAnalysisResult(runId?: string) {
  const [run, setRun] = useState<AnalysisRun | null>(null);
  const [loading, setLoading] = useState(Boolean(runId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) {
      return;
    }
    setLoading(true);
    getAnalysis(runId)
      .then(setRun)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load run."))
      .finally(() => setLoading(false));
  }, [runId]);

  return { run, loading, error };
}

