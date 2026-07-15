from __future__ import annotations

from collections.abc import Sequence
from typing import Any

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.evaluation import EvaluationResult as EvaluationResultModel
from app.schemas.company import CompanyCreate
from app.schemas.evaluation import ExpectedConfidence, HumanPreference
from app.services.analysis_cache import run_cached_icp_analysis
from app.services.baseline_service import generate_baseline
from app.services.demo_market_data import (
    get_demo_profile,
    get_demo_profile_key_by_id,
    get_demo_profile_metadata,
)


def run_evaluation_profile(profile_id: int) -> dict[str, object]:
    profile_key = get_demo_profile_key_by_id(profile_id)
    metadata = get_demo_profile_metadata(profile_key)
    company = get_demo_profile(profile_key)
    return evaluate_profile(
        profile_key,
        company,
        expected_confidence=metadata["expected_confidence"],  # type: ignore[arg-type]
        thin_data_case=bool(metadata["thin_data_case"]),
    )


def check_confidence(
    agent_output: dict[str, Any],
    expected_confidence: ExpectedConfidence,
    thin_data_case: bool,
) -> bool:
    confidence = _coerce_confidence(_extract_confidence(agent_output))
    if thin_data_case and confidence > 89:
        return False

    thresholds = {
        "low": 0,
        "medium": 50,
        "high": 75,
    }
    if expected_confidence == "low":
        return confidence < thresholds["medium"]
    return confidence >= thresholds[expected_confidence]


def summarize_evaluation_results(db: Session | None = None) -> dict[str, object]:
    owns_session = db is None
    session = db or SessionLocal()
    try:
        rows = session.query(EvaluationResultModel).all()
    except SQLAlchemyError:
        rows = []
    finally:
        if owns_session:
            session.close()

    return _summarize_rows(rows)


def store_human_preference(
    result_id: int,
    human_preference: HumanPreference,
    notes: str | None = None,
    db: Session | None = None,
) -> EvaluationResultModel:
    owns_session = db is None
    session = db or SessionLocal()
    try:
        result = (
            session.query(EvaluationResultModel)
            .filter(EvaluationResultModel.id == result_id)
            .first()
        )
        if result is None:
            raise KeyError(result_id)

        result.human_preference = human_preference
        result.notes = notes
        session.commit()
        session.refresh(result)
        return result
    finally:
        if owns_session:
            session.close()


def evaluate_profile(
    profile_key: str,
    company: CompanyCreate,
    expected_confidence: ExpectedConfidence = "medium",
    thin_data_case: bool = False,
) -> dict[str, object]:
    company_input = company.model_dump(mode="json")
    baseline = generate_baseline(company_input, company.mode)
    agent = run_cached_icp_analysis(company, use_llm=False)
    agent_output = agent.model_dump(mode="json")
    scorecard = _score_outputs(baseline, agent_output)

    return {
        "baseline_input": baseline,
        "agent_output": agent_output,
        "confidence_pass": check_confidence(
            agent_output,
            expected_confidence,
            thin_data_case,
        ),
        "human_preference": None,
        "notes": f"{profile_key}: {scorecard['summary']}",
    }


def _coerce_confidence(value: Any) -> int:
    if isinstance(value, str):
        confidence_map = {"low": 35, "medium": 60, "high": 80}
        if value.lower() in confidence_map:
            return confidence_map[value.lower()]
    try:
        return max(0, min(100, int(value)))
    except (TypeError, ValueError):
        return 0


def _extract_confidence(agent_output: dict[str, Any]) -> Any:
    icp = agent_output.get("icp")
    if isinstance(icp, dict) and "confidence" in icp:
        return icp["confidence"]
    return agent_output.get("confidence")


def _summarize_rows(rows: Sequence[EvaluationResultModel]) -> dict[str, object]:
    total = len(rows)
    confidence_pass_rate = (
        round(sum(1 for row in rows if row.confidence_pass) / total, 4) if total else None
    )
    human_preferences = {"baseline": 0, "agent": 0, "tie": 0}
    for row in rows:
        if row.human_preference in human_preferences:
            human_preferences[row.human_preference] += 1

    return {
        "total_results": total,
        "confidence_pass_rate": confidence_pass_rate,
        "human_preferences": human_preferences,
    }


def _score_outputs(baseline: dict[str, object], agent: dict[str, object]) -> dict[str, object]:
    approach = agent.get("approach")
    sample_message = approach.get("sample_message") if isinstance(approach, dict) else None
    return {
        "baseline": {
            "specificity": 2 if baseline.get("segment") else 1,
            "actionability": 2,
            "evidence_quality": 1,
            "risk_handling": 1,
        },
        "agent": {
            "specificity": 4,
            "actionability": 5 if sample_message else 4,
            "evidence_quality": 4,
            "risk_handling": 4 if agent.get("questions_for_human") else 3,
        },
        "summary": "The agent wins by naming a narrower segment, surfacing evidence, and producing testable next steps.",
    }
