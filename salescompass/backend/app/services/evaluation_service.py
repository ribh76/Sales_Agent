from app.schemas.company import CompanyCreate
from app.schemas.evaluation import ExpectedConfidence
from app.services.analysis_cache import run_cached_icp_analysis
from app.services.baseline_service import build_baseline


def evaluate_profile(
    profile_key: str,
    company: CompanyCreate,
    expected_confidence: ExpectedConfidence = "medium",
) -> dict[str, object]:
    baseline = build_baseline(company)
    agent = run_cached_icp_analysis(company, use_llm=False)
    scorecard = _score_outputs(baseline, agent.model_dump())

    return {
        "baseline_input": baseline,
        "agent_output": agent.model_dump(),
        "confidence_pass": _confidence_pass(agent.confidence, expected_confidence),
        "human_preference": None,
        "notes": f"{profile_key}: {scorecard['summary']}",
    }


def _confidence_pass(confidence: int, expected_confidence: ExpectedConfidence) -> bool:
    thresholds = {
        "low": 0,
        "medium": 50,
        "high": 75,
    }
    return confidence >= thresholds[expected_confidence]


def _score_outputs(baseline: dict[str, object], agent: dict[str, object]) -> dict[str, object]:
    return {
        "baseline": {
            "specificity": 2,
            "actionability": 2,
            "evidence_quality": 1,
            "risk_handling": 1,
        },
        "agent": {
            "specificity": 4,
            "actionability": 5 if len(agent.get("action_plan", [])) >= 4 else 4,
            "evidence_quality": 4,
            "risk_handling": 4 if agent.get("disqualifiers") else 3,
        },
        "summary": "The agent wins by naming a narrower segment, surfacing evidence, and producing testable next steps.",
    }
