import type { AnalysisCreatePayload, AnalysisRun, FeedbackPayload } from "@/types/analysis";
import type { LoginPayload, RegisterPayload, Token, User } from "@/types/auth";
import type {
  EvaluationProfile,
  EvaluationResult,
  EvaluationSummaryData,
  HumanPreference
} from "@/types/evaluation";
import { getStoredToken } from "./auth";
import { API_BASE_URL } from "./constants";

type RequestOptions = RequestInit & {
  auth?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body && !(options.body instanceof URLSearchParams)) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false) {
    const token = getStoredToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let message = `Request failed with ${response.status}`;
    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload.detail) {
        message = payload.detail;
      }
    } catch {
      // Keep the status-based fallback.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function register(payload: RegisterPayload): Promise<User> {
  return request<User>("/auth/register", {
    method: "POST",
    auth: false,
    body: JSON.stringify(payload)
  });
}

export function login(payload: LoginPayload): Promise<Token> {
  const body = new URLSearchParams();
  body.set("username", payload.email);
  body.set("password", payload.password);
  return request<Token>("/auth/login", {
    method: "POST",
    auth: false,
    body
  });
}

export function getMe(): Promise<User> {
  return request<User>("/auth/me");
}

export function createAnalysis(payload: AnalysisCreatePayload): Promise<AnalysisRun> {
  return request<AnalysisRun>("/analyses", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function listAnalyses(): Promise<AnalysisRun[]> {
  return request<AnalysisRun[]>("/analyses");
}

export function getAnalysis(runId: string | number): Promise<AnalysisRun> {
  return request<AnalysisRun>(`/analyses/${runId}`);
}

export function submitFeedback(payload: FeedbackPayload): Promise<unknown> {
  return request("/feedback", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function listEvaluationProfiles(): Promise<EvaluationProfile[]> {
  return request<EvaluationProfile[]>("/evaluation/profiles", { auth: false });
}

export function runEvaluation(profileKey: string): Promise<EvaluationResult> {
  return request<EvaluationResult>("/evaluation/run", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ profile_key: profileKey })
  });
}

export function rateEvaluationResult(
  resultId: number,
  payload: { human_preference: HumanPreference; notes?: string }
): Promise<EvaluationResult> {
  return request<EvaluationResult>(`/evaluation/results/${resultId}/rate`, {
    method: "POST",
    auth: false,
    body: JSON.stringify(payload)
  });
}

export function getEvaluationSummary(): Promise<EvaluationSummaryData> {
  return request<EvaluationSummaryData>("/evaluation/summary", { auth: false });
}
