from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("icp_runs.id"), nullable=False, index=True)
    outcome = Column(Text, nullable=True)
    reason = Column(Text, nullable=True)
    rating = Column(Integer, nullable=False)
    confidence = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    run = relationship("ICPRun", back_populates="feedback")

    @property
    def icp_run_id(self) -> int:
        return self.run_id
