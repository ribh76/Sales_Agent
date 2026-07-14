from app.services.demo_market_data import get_demo_profile
from app.services.evaluation_service import evaluate_profile


def test_evaluation_scores_agent() -> None:
    company = get_demo_profile("northstar-enablement")
    result = evaluate_profile("northstar-enablement", company)
    assert result["confidence_pass"] is True
    assert "recommended_icp" in result["agent_output"]
