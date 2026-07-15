from app.services.demo_market_data import get_demo_profile
from app.services.evaluation_service import (
    check_confidence,
    evaluate_profile,
    run_evaluation_profile,
    summarize_evaluation_results,
)


def test_evaluation_scores_agent() -> None:
    company = get_demo_profile("northstar-enablement")
    result = evaluate_profile("northstar-enablement", company)
    assert result["confidence_pass"] is True
    assert result["agent_output"]["icp"]["profile"]


def test_run_evaluation_profile_uses_seeded_profile_id() -> None:
    result = run_evaluation_profile(1)

    assert result["baseline_input"]["segment"]
    assert result["agent_output"]["icp"]["profile"]
    assert result["human_preference"] is None


def test_check_confidence_accounts_for_thin_data() -> None:
    assert check_confidence({"icp": {"confidence": "high"}}, "medium", thin_data_case=True) is True
    assert check_confidence({"confidence": 95}, "medium", thin_data_case=True) is False
    assert check_confidence({"icp": {"confidence": "high"}}, "high", thin_data_case=False) is True


def test_summarize_evaluation_results_counts_preferences() -> None:
    class FakeQuery:
        def all(self):
            return [
                type("Row", (), {"confidence_pass": True, "human_preference": "agent"})(),
                type("Row", (), {"confidence_pass": False, "human_preference": "baseline"})(),
                type("Row", (), {"confidence_pass": True, "human_preference": None})(),
            ]

    class FakeDb:
        def query(self, model):
            return FakeQuery()

    summary = summarize_evaluation_results(FakeDb())  # type: ignore[arg-type]

    assert summary["total_results"] == 3
    assert summary["confidence_pass_rate"] == 0.6667
    assert summary["human_preferences"] == {"baseline": 1, "agent": 1, "tie": 0}
