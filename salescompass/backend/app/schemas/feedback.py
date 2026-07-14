from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FeedbackCreate(BaseModel):
    run_id: int
    rating: int = Field(ge=1, le=5)
    confidence: int = Field(ge=1, le=5)
    notes: str | None = None


class FeedbackRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    run_id: int
    rating: int
    confidence: int
    notes: str | None
    created_at: datetime

