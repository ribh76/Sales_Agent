from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator

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


class AnalysisResult(BaseModel):
    diagnosis: str
    recommended_icp: str
    confidence: int = Field(ge=0, le=100)
    market_scores: list[SegmentScore]
    disqualifiers: list[str]
    external_benchmarks: list[str]
    action_plan: list[str]
    outreach: list[OutreachVariation]
    human_checkpoint: str
    assumptions: list[str]


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
