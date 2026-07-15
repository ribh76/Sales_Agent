from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict

from app.schemas.analysis import AnalysisResult
from app.schemas.company import CompanyCreate, CompanyMode

ExpectedConfidence = Literal["low", "medium", "high"]
HumanPreference = Literal["baseline", "agent", "tie"]


class EvaluationProfile(BaseModel):
    key: str
    label: str
    company: CompanyCreate
    mode: CompanyMode
    profile_input: dict[str, Any]
    expected_confidence: ExpectedConfidence
    thin_data_case: bool


class EvaluationRunRequest(BaseModel):
    profile_key: str


class EvaluationRateRequest(BaseModel):
    human_preference: HumanPreference
    notes: str | None = None


class EvaluationResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    evaluation_profile_id: int
    baseline_input: dict[str, Any]
    agent_output: AnalysisResult
    confidence_pass: bool
    human_preference: HumanPreference | None
    notes: str | None
    created_at: datetime

    profile_key: str | None = None
    baseline_result: dict[str, Any] | None = None
    agent_result: AnalysisResult | None = None
    scorecard: dict[str, Any] | None = None


class EvaluationSummary(BaseModel):
    total_results: int
    confidence_pass_rate: float | None
    human_preferences: dict[str, int]
