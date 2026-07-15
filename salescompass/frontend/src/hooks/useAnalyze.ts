"use client";

import { useState } from "react";
import { createAnalysis } from "@/lib/api";
import { adaptAnalysisRun } from "@/lib/analysisAdapter";
import type { AnalysisViewModel } from "@/types/analysis";
import type { CompanyInput } from "@/types/company";

export function useAnalyze() {
  const [run, setRun] = useState<AnalysisViewModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze(company: CompanyInput) {
    setLoading(true);
    setError(null);
    try {
      const result = adaptAnalysisRun(await createAnalysis({ company }));
      setRun(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { analyze, run, loading, error };
}
