from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.company import CompanyCreate, CompanyMode, CompanyRead


class SegmentScore(BaseModel):
    name: str
    score: int = Field(ge=0, le=100)
    fit: int = Field(ge=0, le=100)
    urgency: int = Field(ge=0, le=100)
    reachability: int = Field(ge=0, le=100)
    deal_quality: int = Field(ge=0, le=100)
    evidence: list[str]


class OutreachVariation(BaseModel):
    title: str
    channel: str
    message: str


class MarketSegment(BaseModel):
    model_config = ConfigDict(extra="allow", strict=True)

    name: str
    scores: dict[str, int]
    total: int | None = Field(default=None, ge=1, le=10)
    rationale: str = ""

    @field_validator("scores")
    @classmethod
    def require_scores_between_one_and_ten(cls, value: dict[str, int]) -> dict[str, int]:
        if not value:
            raise ValueError("market scores are required")
        for score_name, score in value.items():
            if isinstance(score, bool) or not isinstance(score, int) or not 1 <= score <= 10:
                raise ValueError(f"{score_name} must be an integer from 1 to 10")
        return value


class ICPOutput(BaseModel):
    model_config = ConfigDict(extra="allow")

    confidence: Literal["low", "medium", "high"]


class ApproachOutput(BaseModel):
    model_config = ConfigDict(extra="allow")

    sample_message: str = Field(min_length=1)


class AnalysisResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    diagnosis: str = Field(min_length=1)
    external_benchmarks: list[Any]
    markets: list[MarketSegment] = Field(max_length=3)
    icp: ICPOutput
    approach: ApproachOutput
    hypotheses_to_validate: list[str]
    questions_for_human: list[str]


class AnalysisCreate(BaseModel):
    company: CompanyCreate | None = None
    company_id: int | None = None
    mode: CompanyMode | None = None
    input: dict[str, Any] | None = None

    @model_validator(mode="after")
    def require_analysis_input(self) -> "AnalysisCreate":
        if self.company is None and self.company_id is None and self.input is None:
            raise ValueError("Provide either company, company_id, or input")
        return self


class AnalysisRefineRequest(BaseModel):
    notes: str = Field(min_length=1, max_length=4000)
    input: dict[str, Any] | None = None


class ActionPlanResponse(BaseModel):
    run_id: int
    action_plan: dict[str, Any] | list[Any]


class ICPRunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    run_id: int
    user_id: int
    company_id: int
    status: str
    mode: str
    input_snapshot: dict[str, Any]
    agent_output: AnalysisResult
    baseline_output: dict[str, Any]
    action_plan: dict[str, Any] | list[Any] | None = None
    refinement_notes: str | None = None
    error_message: str | None = None
    result: AnalysisResult
    model_name: str
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None
    company: CompanyRead | None = None
