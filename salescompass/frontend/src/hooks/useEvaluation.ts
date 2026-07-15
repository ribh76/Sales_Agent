"use client";

import { useEffect, useState } from "react";
import {
  getEvaluationSummary,
  listEvaluationProfiles,
  rateEvaluationResult,
  runEvaluation
} from "@/lib/api";
import type {
  EvaluationProfile,
  EvaluationResult,
  EvaluationSummaryData,
  HumanPreference
} from "@/types/evaluation";

export function useEvaluation() {
  const [profiles, setProfiles] = useState<EvaluationProfile[]>([]);
  const [selectedKey, setSelectedKey] = useState("northstar-enablement");
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [summary, setSummary] = useState<EvaluationSummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingPreference, setSavingPreference] = useState(false);
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
    refreshSummary();
  }, []);

  async function refreshSummary() {
    try {
      const nextSummary = await getEvaluationSummary();
      setSummary(nextSummary);
    } catch {
      setSummary(null);
    }
  }

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const evaluation = await runEvaluation(selectedKey);
      setResult(evaluation);
      await refreshSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed.");
    } finally {
      setLoading(false);
    }
  }

  async function savePreference(humanPreference: HumanPreference, notes?: string) {
    if (!result) {
      return;
    }

    setSavingPreference(true);
    setError(null);
    try {
      const updated = await rateEvaluationResult(result.id, {
        human_preference: humanPreference,
        notes: notes?.trim() || undefined
      });
      setResult(updated);
      await refreshSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save preference.");
      throw err;
    } finally {
      setSavingPreference(false);
    }
  }

  return {
    profiles,
    selectedKey,
    setSelectedKey,
    result,
    summary,
    loading,
    savingPreference,
    error,
    run,
    savePreference
  };
}
