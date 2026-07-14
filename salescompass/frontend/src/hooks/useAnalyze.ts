"use client";

import { useState } from "react";
import { createAnalysis } from "@/lib/api";
import type { AnalysisRun } from "@/types/analysis";
import type { CompanyInput } from "@/types/company";

export function useAnalyze() {
  const [run, setRun] = useState<AnalysisRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze(company: CompanyInput) {
    setLoading(true);
    setError(null);
    try {
      const result = await createAnalysis({ company });
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

