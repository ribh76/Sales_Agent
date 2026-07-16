from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.db.types import JSONBType
from app.utils.time import utcnow


class ICPRun(Base):
    __tablename__ = "icp_runs"
    __table_args__ = (
        CheckConstraint("status IN ('pending', 'completed', 'failed')", name="ck_icp_runs_status"),
        CheckConstraint("mode IN ('history', 'no_history')", name="ck_icp_runs_mode"),
        CheckConstraint(
            "review_status IN ('needs_review', 'approved')",
            name="ck_icp_runs_review_status",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    status = Column(String(50), default="pending", nullable=False, index=True)
    mode = Column(String(20), nullable=False, index=True)
    input_snapshot = Column(JSONBType, nullable=False)
    agent_output = Column(JSONBType, default=dict, nullable=False)
    baseline_output = Column(JSONBType, default=dict, nullable=False)
    action_plan = Column(JSONBType, nullable=True)
    review_status = Column(String(30), default="needs_review", nullable=False, index=True)
    refinement_notes = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User", back_populates="icp_runs")
    company = relationship("Company", back_populates="runs")
    feedback = relationship("Feedback", back_populates="run", cascade="all, delete-orphan")

    @property
    def run_id(self) -> int:
        return self.id

    @property
    def result(self) -> dict:
        return self.agent_output

    @result.setter
    def result(self, value: dict) -> None:
        self.agent_output = value

    @property
    def model_name(self) -> str:
        return "deterministic-v1"

    @property
    def completed_at(self):
        return self.updated_at if self.status == "completed" else None
