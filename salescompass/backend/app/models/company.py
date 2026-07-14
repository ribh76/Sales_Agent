import json
from typing import Any

from sqlalchemy import CheckConstraint, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.db.types import JSONBType
from app.utils.time import utcnow


class Company(Base):
    __tablename__ = "companies"
    __table_args__ = (
        CheckConstraint("mode IN ('history', 'no_history')", name="ck_companies_mode"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    mode = Column(String(20), nullable=False, index=True)
    industry = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)

    average_ticket = Column(Float, nullable=True)
    margin = Column(Float, nullable=True)
    conversion_rate = Column(Float, nullable=True)
    average_sales_cycle = Column(Float, nullable=True)
    past_clients = Column(JSONBType, nullable=True)
    past_lost_deals = Column(JSONBType, nullable=True)
    loss_reasons = Column(JSONBType, nullable=True)
    current_markets = Column(JSONBType, nullable=True)

    problem_solved = Column(Text, nullable=True)
    target_user_guess = Column(Text, nullable=True)
    hypothetical_ticket = Column(Float, nullable=True)
    known_competitors = Column(JSONBType, nullable=True)
    early_leads = Column(JSONBType, nullable=True)

    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User", back_populates="companies")
    runs = relationship("ICPRun", back_populates="company", cascade="all, delete-orphan")

    @property
    def owner_id(self) -> int:
        return self.user_id

    @owner_id.setter
    def owner_id(self, value: int) -> None:
        self.user_id = value

    @property
    def has_customer_history(self) -> bool:
        return self.mode == "history"

    @has_customer_history.setter
    def has_customer_history(self, value: bool) -> None:
        self.mode = "history" if value else "no_history"

    @property
    def average_contract_value(self) -> float | None:
        return self.average_ticket or self.hypothetical_ticket

    @average_contract_value.setter
    def average_contract_value(self, value: float | None) -> None:
        if self.mode == "history":
            self.average_ticket = value
        else:
            self.hypothetical_ticket = value

    @property
    def customer_history(self) -> str | None:
        values = {
            "past_clients": self.past_clients,
            "past_lost_deals": self.past_lost_deals,
            "loss_reasons": self.loss_reasons,
            "current_markets": self.current_markets,
        }
        populated = {key: value for key, value in values.items() if value}
        return json.dumps(populated) if populated else None

    @customer_history.setter
    def customer_history(self, value: Any) -> None:
        if value:
            self.past_clients = value
