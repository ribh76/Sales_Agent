import json
import re
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

CompanyMode = Literal["history", "no_history"]

COMPANY_MODEL_FIELDS = {
    "name",
    "mode",
    "industry",
    "description",
    "average_ticket",
    "margin",
    "conversion_rate",
    "average_sales_cycle",
    "past_clients",
    "past_lost_deals",
    "loss_reasons",
    "current_markets",
    "problem_solved",
    "target_user_guess",
    "hypothetical_ticket",
    "known_competitors",
    "early_leads",
}

NUMERIC_COMPANY_FIELDS = (
    "average_ticket",
    "margin",
    "conversion_rate",
    "average_sales_cycle",
    "hypothetical_ticket",
    "average_contract_value",
)


def parse_optional_number(value: Any) -> Any:
    if value is None or isinstance(value, int | float):
        return value

    if isinstance(value, str):
        normalized = value.strip()
        if not normalized:
            return None

        match = re.search(r"-?\d+(?:\.\d+)?", normalized.replace(",", ""))
        if match:
            return float(match.group(0))

    return value


class CompanyBase(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    mode: CompanyMode | None = None
    industry: str = Field(min_length=2, max_length=255)
    description: str = Field(min_length=20)

    average_ticket: float | None = Field(default=None, ge=0)
    margin: float | None = None
    conversion_rate: float | None = None
    average_sales_cycle: float | None = Field(default=None, ge=0)
    past_clients: Any | None = None
    past_lost_deals: Any | None = None
    loss_reasons: Any | None = None
    current_markets: Any | None = None

    problem_solved: str | None = None
    target_user_guess: str | None = None
    hypothetical_ticket: float | None = Field(default=None, ge=0)
    known_competitors: Any | None = None
    early_leads: Any | None = None

    website: str | None = None
    stage: str | None = Field(default=None, min_length=2, max_length=100)
    average_contract_value: float | None = Field(default=None, ge=0)
    has_customer_history: bool | None = None
    customer_history: str | None = None

    @field_validator(*NUMERIC_COMPANY_FIELDS, mode="before")
    @classmethod
    def normalize_numeric_strings(cls, value: Any) -> Any:
        return parse_optional_number(value)

    @model_validator(mode="after")
    def normalize_legacy_fields(self) -> "CompanyBase":
        if self.mode is None:
            self.mode = "history" if self.has_customer_history else "no_history"

        if self.has_customer_history is None:
            self.has_customer_history = self.mode == "history"

        if self.average_ticket is None and self.average_contract_value is not None:
            if self.mode == "history":
                self.average_ticket = self.average_contract_value
            else:
                self.hypothetical_ticket = self.average_contract_value

        if self.average_contract_value is None:
            self.average_contract_value = self.average_ticket or self.hypothetical_ticket

        if self.customer_history and self.past_clients is None:
            self.past_clients = [self.customer_history]

        return self

    def to_model_dict(self) -> dict[str, Any]:
        return self.model_dump(mode="json", include=COMPANY_MODEL_FIELDS, exclude_none=True)

    def analysis_stage(self) -> str:
        if self.stage:
            return self.stage
        return "history-backed" if self.mode == "history" else "early no-history"

    def analysis_average_ticket(self) -> float | None:
        return self.average_ticket or self.hypothetical_ticket or self.average_contract_value

    def analysis_history_text(self) -> str:
        if self.customer_history:
            return self.customer_history

        history_values = {
            "past_clients": self.past_clients,
            "past_lost_deals": self.past_lost_deals,
            "loss_reasons": self.loss_reasons,
            "current_markets": self.current_markets,
        }
        populated = {key: value for key, value in history_values.items() if value}
        return json.dumps(populated) if populated else ""


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    mode: CompanyMode | None = None
    industry: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = Field(default=None, min_length=20)

    average_ticket: float | None = Field(default=None, ge=0)
    margin: float | None = None
    conversion_rate: float | None = None
    average_sales_cycle: float | None = Field(default=None, ge=0)
    past_clients: Any | None = None
    past_lost_deals: Any | None = None
    loss_reasons: Any | None = None
    current_markets: Any | None = None

    problem_solved: str | None = None
    target_user_guess: str | None = None
    hypothetical_ticket: float | None = Field(default=None, ge=0)
    known_competitors: Any | None = None
    early_leads: Any | None = None

    website: str | None = None
    stage: str | None = Field(default=None, min_length=2, max_length=100)
    average_contract_value: float | None = Field(default=None, ge=0)
    has_customer_history: bool | None = None
    customer_history: str | None = None

    @field_validator(*NUMERIC_COMPANY_FIELDS, mode="before")
    @classmethod
    def normalize_numeric_strings(cls, value: Any) -> Any:
        return parse_optional_number(value)

    def to_model_dict(self) -> dict[str, Any]:
        data = self.model_dump(mode="json", exclude_unset=True, exclude_none=True)

        if "has_customer_history" in data and "mode" not in data:
            data["mode"] = "history" if data["has_customer_history"] else "no_history"

        if "average_contract_value" in data:
            if data.get("mode") == "no_history":
                data.setdefault("hypothetical_ticket", data["average_contract_value"])
            else:
                data.setdefault("average_ticket", data["average_contract_value"])

        if "customer_history" in data and "past_clients" not in data:
            data["past_clients"] = [data["customer_history"]]

        return {key: value for key, value in data.items() if key in COMPANY_MODEL_FIELDS}


class CompanyRead(CompanyBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
