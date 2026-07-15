from datetime import datetime
from typing import Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class FeedbackCreate(BaseModel):
    icp_run_id: int = Field(validation_alias=AliasChoices("icp_run_id", "run_id"))
    outcome: Literal["won", "lost", "open", "unknown"] | None = None
    reason: str | None = None
    rating: int | None = Field(default=None, ge=1, le=5)
    confidence: int | None = Field(default=None, ge=1, le=5)
    notes: str | None = None


class FeedbackRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    run_id: int
    icp_run_id: int
    outcome: str | None = None
    reason: str | None = None
    rating: int
    confidence: int
    notes: str | None
    created_at: datetime
