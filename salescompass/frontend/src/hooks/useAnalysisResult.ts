"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, getAnalysis } from "@/lib/api";
import { adaptAnalysisRun } from "@/lib/analysisAdapter";
import type { AnalysisRunApi, AnalysisViewModel } from "@/types/analysis";

export type ResultLoadErrorKind =
  | "not_found"
  | "unauthorized"
  | "backend_unavailable"
  | "unknown";

export type ResultLoadError = {
  kind: ResultLoadErrorKind;
  title: string;
  message: string;
};

export function useAnalysisResult(runId?: string) {
  const [run, setRun] = useState<AnalysisViewModel | null>(null);
  const [loading, setLoading] = useState(Boolean(runId));
  const [error, setError] = useState<ResultLoadError | null>(null);

  const applyRun = useCallback((apiRun: AnalysisRunApi) => {
    const nextRun = adaptAnalysisRun(apiRun);
    setRun(nextRun);
    return nextRun;
  }, []);

  const refresh = useCallback(async () => {
    if (!runId) {
      return null;
    }
    setError(null);
    try {
      const response = await getAnalysis(runId);
      return applyRun(response);
    } catch (err) {
      setError(toResultLoadError(err));
      throw err;
    }
  }, [applyRun, runId]);

  useEffect(() => {
    if (!runId) {
      return;
    }
    setLoading(true);
    refresh()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [refresh, runId]);

  return { run, loading, error, refresh, applyRun };
}

function toResultLoadError(err: unknown): ResultLoadError {
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403) {
      return {
        kind: "unauthorized",
        title: "You are not authorized to view this result",
        message: "Please sign in with the account that created this workflow result.",
      };
    }

    if (err.status === 404) {
      return {
        kind: "not_found",
        title: "Result not found",
        message: "This workflow result could not be found. It may have been deleted or belongs to another account.",
      };
    }

    if (err.status >= 500) {
      return {
        kind: "backend_unavailable",
        title: "Backend unavailable",
        message: "SalesCompass could not load this result from the backend. Try again in a moment.",
      };
    }

    return {
      kind: "unknown",
      title: "Could not load result",
      message: err.message || "SalesCompass could not load this workflow result.",
    };
  }

  if (err instanceof TypeError) {
    return {
      kind: "backend_unavailable",
      title: "Backend unavailable",
      message: "SalesCompass could not reach the backend. Try again in a moment.",
    };
  }

  return {
    kind: "unknown",
    title: "Could not load result",
    message: "SalesCompass could not load this workflow result.",
  };
}
