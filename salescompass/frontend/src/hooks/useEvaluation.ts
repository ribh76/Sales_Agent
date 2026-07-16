"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getEvaluationSummary,
  listEvaluationProfiles,
  rateEvaluationResult,
  runEvaluation
} from "@/lib/api";
import {
  adaptEvaluationProfiles,
  adaptEvaluationResult,
  adaptEvaluationSummary,
} from "@/lib/adapters/evaluationAdapter";
import type {
  EvaluationProfileView,
  EvaluationResultApi,
  EvaluationResultView,
  EvaluationSummaryView,
  HumanPreference
} from "@/types/evaluation";

export function useEvaluation() {
  const [profiles, setProfiles] = useState<EvaluationProfileView[]>([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [result, setResult] = useState<EvaluationResultView | null>(null);
  const [summary, setSummary] = useState<EvaluationSummaryView | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [savingPreference, setSavingPreference] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [ratingError, setRatingError] = useState<string | null>(null);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedKey) ?? profiles[0] ?? null,
    [profiles, selectedKey]
  );

  useEffect(() => {
    loadProfiles();
    // Run once on mount; loadProfiles reads current state only for fallback summary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProfiles() {
    setLoadingProfiles(true);
    setProfilesError(null);
    setRunError(null);

    try {
      const rawProfiles = await listEvaluationProfiles();
      const profileViews = adaptEvaluationProfiles(rawProfiles);
      setProfiles(profileViews);
      setSelectedKey((current) => {
        if (profileViews.some((profile) => profile.id === current)) {
          return current;
        }

        return profileViews[0]?.id ?? "";
      });
      await refreshSummary(profileViews);
    } catch (err) {
      setProfiles([]);
      setSummary(adaptEvaluationSummary({}, []));
      setProfilesError(err instanceof Error ? err.message : "Could not load evaluation profiles.");
    } finally {
      setLoadingProfiles(false);
    }
  }

  async function refreshSummary(nextProfiles = profiles): Promise<boolean> {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const rawSummary = await getEvaluationSummary();
      setSummary(adaptEvaluationSummary(rawSummary, nextProfiles));
      return true;
    } catch {
      setSummary(adaptEvaluationSummary({}, nextProfiles));
      setSummaryError("Could not load evaluation summary.");
      return false;
    } finally {
      setSummaryLoading(false);
    }
  }

  async function run() {
    if (!selectedProfile) {
      setRunError("Choose an evaluation profile before running the comparison.");
      return;
    }

    setLoading(true);
    setRunError(null);
    setRatingError(null);
    try {
      const evaluation = await runEvaluation(selectedProfile.id);
      setResult(adaptEvaluationResult(evaluation, selectedProfile));
      await refreshSummary();
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Evaluation failed.");
    } finally {
      setLoading(false);
    }
  }

  async function saveHumanPreference(humanPreference: HumanPreference, notes?: string) {
    if (!result) {
      return;
    }

    const previousPreference = result.humanPreference;
    const cleanNotes = notes?.trim() || undefined;
    setSavingPreference(true);
    setRatingError(null);

    try {
      const updated = await rateEvaluationResult(result.resultId, {
        human_preference: humanPreference,
        notes: cleanNotes
      });
      const nextResult = hasFullEvaluationResult(updated)
        ? adaptEvaluationResult(updated, result.profile)
        : {
            ...result,
            humanPreference,
            notes: cleanNotes ?? result.notes,
          };

      setResult(nextResult);
      const refreshed = await refreshSummary();
      if (!refreshed) {
        setSummary((current) => updateSummaryPreference(current, previousPreference, humanPreference));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save preference.";
      setRatingError(message);
      throw new Error(message);
    } finally {
      setSavingPreference(false);
    }
  }

  return {
    profiles,
    selectedProfile,
    selectedProfileId: selectedKey,
    selectedKey,
    setSelectedProfileId: setSelectedKey,
    setSelectedKey,
    currentResult: result,
    result,
    summary,
    loadingProfiles,
    loading,
    summaryLoading,
    savingPreference,
    profilesError,
    runError,
    summaryError,
    ratingError,
    error: profilesError ?? runError,
    loadProfiles,
    refreshSummary,
    run,
    saveHumanPreference,
    savePreference: saveHumanPreference
  };
}

function hasFullEvaluationResult(value: EvaluationResultApi): boolean {
  return Boolean(value.id && (value.agent_output || value.agent_result));
}

function updateSummaryPreference(
  summary: EvaluationSummaryView | null,
  previousPreference: HumanPreference | null,
  nextPreference: HumanPreference
): EvaluationSummaryView {
  const current = summary ?? adaptEvaluationSummary({}, []);

  return {
    ...current,
    agentPreferred: adjustPreferenceCount(current.agentPreferred, previousPreference, nextPreference, "agent"),
    baselinePreferred: adjustPreferenceCount(
      current.baselinePreferred,
      previousPreference,
      nextPreference,
      "baseline"
    ),
    ties: adjustPreferenceCount(current.ties, previousPreference, nextPreference, "tie"),
  };
}

function adjustPreferenceCount(
  count: number,
  previousPreference: HumanPreference | null,
  nextPreference: HumanPreference,
  target: HumanPreference
): number {
  let nextCount = Number.isFinite(count) ? count : 0;
  if (previousPreference === target) {
    nextCount -= 1;
  }
  if (nextPreference === target) {
    nextCount += 1;
  }
  return Math.max(0, nextCount);
}
