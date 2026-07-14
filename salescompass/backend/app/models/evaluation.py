from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.db.types import JSONBType
from app.utils.time import utcnow


class EvaluationProfile(Base):
    __tablename__ = "evaluation_profiles"
    __table_args__ = (
        CheckConstraint("mode IN ('history', 'no_history')", name="ck_evaluation_profiles_mode"),
        CheckConstraint(
            "expected_confidence IN ('low', 'medium', 'high')",
            name="ck_evaluation_profiles_expected_confidence",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    mode = Column(String(20), nullable=False, index=True)
    profile_input = Column(JSONBType, nullable=False)
    expected_confidence = Column(String(20), nullable=False)
    thin_data_case = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    results = relationship(
        "EvaluationResult",
        back_populates="evaluation_profile",
        cascade="all, delete-orphan",
    )


class EvaluationResult(Base):
    __tablename__ = "evaluation_results"
    __table_args__ = (
        CheckConstraint(
            "human_preference IS NULL OR human_preference IN ('baseline', 'agent', 'tie')",
            name="ck_evaluation_results_human_preference",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    evaluation_profile_id = Column(
        Integer,
        ForeignKey("evaluation_profiles.id"),
        nullable=False,
        index=True,
    )
    baseline_input = Column(JSONBType, nullable=False)
    agent_output = Column(JSONBType, nullable=False)
    confidence_pass = Column(Boolean, nullable=False)
    human_preference = Column(String(20), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    evaluation_profile = relationship("EvaluationProfile", back_populates="results")

    @property
    def profile_key(self) -> str | None:
        return self.evaluation_profile.name if self.evaluation_profile else None

    @property
    def baseline_result(self) -> dict:
        return self.baseline_input

    @property
    def agent_result(self) -> dict:
        return self.agent_output

    @property
    def scorecard(self) -> dict:
        return {
            "baseline": {
                "specificity": 2,
                "actionability": 2,
                "evidence_quality": 1,
                "risk_handling": 1,
            },
            "agent": {
                "specificity": 4,
                "actionability": 5,
                "evidence_quality": 4,
                "risk_handling": 4,
            },
            "confidence_pass": self.confidence_pass,
            "human_preference": self.human_preference,
            "summary": self.notes,
        }
