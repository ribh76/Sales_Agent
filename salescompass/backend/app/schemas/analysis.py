from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.company import CompanyCreate, CompanyRead


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
    company: CompanyCreate


class ICPRunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
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
