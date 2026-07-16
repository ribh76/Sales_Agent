import type { AnalysisRunApi, CompanyMode } from "@/types/analysis";
import type { LoginPayload, RegisterPayload, Token, User } from "@/types/auth";
import type { CompanyInput } from "@/types/company";
import type {
  EvaluationProfileApi,
  EvaluationResultApi,
  EvaluationSummaryApi,
  HumanPreference
} from "@/types/evaluation";
import { getStoredToken } from "./auth";
import { API_BASE_URL } from "./constants";

type RequestOptions = RequestInit & {
  auth?: boolean;
};

type AnalysisCreatePayload = {
  company?: CompanyInput;
  company_id?: number;
  mode?: CompanyMode;
  input?: Record<string, unknown>;
};

type FeedbackPayload = {
  run_id: number;
  rating: number;
  confidence: number;
  notes?: string;
};

type ActionPlanResponse = {
  run_id: number;
  action_plan: Record<string, unknown> | unknown[];
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function formatErrorDetail(detail: unknown): string | undefined {
  if (typeof detail === "string" && detail.trim()) {
    return detail.trim();
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && typeof item === "object" && "msg" in item) {
          const message = (item as { msg?: unknown }).msg;
          return typeof message === "string" ? message : undefined;
        }

        return undefined;
      })
      .filter((item): item is string => Boolean(item));
    return messages.length ? messages.join(" ") : undefined;
  }

  return undefined;
}

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
      const payload = (await response.json()) as { detail?: unknown };
      const detail = formatErrorDetail(payload.detail);
      if (detail) {
        message = detail;
      }
    } catch {
      // Keep the status-based fallback.
    }
    throw new ApiError(message, response.status);
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

export function createAnalysis(payload: AnalysisCreatePayload): Promise<AnalysisRunApi> {
  return request<AnalysisRunApi>("/analyses", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function listAnalyses(): Promise<AnalysisRunApi[]> {
  return request<AnalysisRunApi[]>("/analyses");
}

export function getAnalysis(runId: string | number): Promise<AnalysisRunApi> {
  return request<AnalysisRunApi>(`/analyses/${runId}`);
}

export function approveAnalysis(runId: string | number): Promise<AnalysisRunApi> {
  return request<AnalysisRunApi>(`/analyses/${runId}/approve`, {
    method: "POST"
  });
}

export function refineAnalysis(runId: string | number, notes: string): Promise<AnalysisRunApi> {
  return request<AnalysisRunApi>(`/analyses/${runId}/refine`, {
    method: "POST",
    body: JSON.stringify({ notes })
  });
}

export function generateActionPlan(runId: string | number): Promise<ActionPlanResponse> {
  return request<ActionPlanResponse>(`/analyses/${runId}/action-plan`, {
    method: "POST"
  });
}

export function submitFeedback(payload: FeedbackPayload): Promise<unknown> {
  return request("/feedback", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function listEvaluationProfiles(): Promise<EvaluationProfileApi[]> {
  return request<EvaluationProfileApi[]>("/evaluation/profiles", { auth: false });
}

export function runEvaluation(profileKey: string): Promise<EvaluationResultApi> {
  return request<EvaluationResultApi>("/evaluation/run", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ profile_key: profileKey })
  });
}

export function rateEvaluationResult(
  resultId: number,
  payload: { human_preference: HumanPreference; notes?: string }
): Promise<EvaluationResultApi> {
  return request<EvaluationResultApi>(`/evaluation/results/${resultId}/rate`, {
    method: "POST",
    auth: false,
    body: JSON.stringify(payload)
  });
}

export function getEvaluationSummary(): Promise<EvaluationSummaryApi> {
  return request<EvaluationSummaryApi>("/evaluation/summary", { auth: false });
}
