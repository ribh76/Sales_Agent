from types import SimpleNamespace
from typing import Any

from app.services import analysis_pipeline
from app.services import anthropic_client
from app.services.analysis_pipeline import AgentOutputValidationError
from app.services.prompts import (
    build_action_plan_prompt,
    build_analysis_prompt,
    build_feedback_prompt,
    build_refine_prompt,
)


COMPANY_INPUT = {
    "name": "Acme Ops Consulting",
    "mode": "history",
    "industry": "Manufacturing consulting",
    "description": "Helps manufacturers reduce downtime across plants and production lines.",
    "average_ticket": 25000,
    "past_clients": "mid-market manufacturers, logistics operators",
}

NO_HISTORY_COMPANY_INPUT = {
    "name": "Acme Launch Labs",
    "mode": "no_history",
    "industry": "Manufacturing consulting",
    "description": "Helps manufacturers reduce downtime across plants before customer history exists.",
    "problem_solved": "Downtime reduction",
    "target_user_guess": "Plant operations leaders",
    "hypothetical_ticket": 12000,
}


def valid_agent_output() -> dict[str, Any]:
    return {
        "diagnosis": "Acme should focus on manufacturers with downtime reduction mandates.",
        "external_benchmarks": [
            {
                "stat": "Prioritize segments with measurable operational pain",
                "source": "SalesCompass heuristic",
            }
        ],
        "markets": [
            {
                "name": "Mid-market manufacturers",
                "scores": {
                    "size": 7,
                    "access": 8,
                    "ticket": 8,
                    "cycle": 7,
                    "competition": 6,
                },
                "total": 8,
                "rationale": "Past clients include mid-market manufacturers.",
            }
        ],
        "icp": {
            "profile": "Mid-market manufacturing operators with measurable downtime pain.",
            "company_size": "Mid-market",
            "target_industry": "Manufacturing",
            "region": "North America",
            "decision_maker": "Operations leader",
            "main_pain": "Downtime reduction",
            "rationale": "The input includes strong customer history.",
            "confidence": "high",
            "confidence_basis": "Past clients match the target segment.",
        },
        "approach": {
            "channel": "Email",
            "trigger": "Downtime target changes",
            "first_contact": "Operations leader",
            "message_tone": "Direct",
            "sample_message": "Are downtime targets changing your operating priorities this quarter?",
            "confidence": "high",
            "confidence_basis": "Message ties to a measurable pain.",
        },
        "hypotheses_to_validate": ["Manufacturers have a named downtime owner."],
        "questions_for_human": ["Who owns downtime reduction?"],
    }


def test_call_claude_json_parses_text_and_enables_web_search(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    class FakeMessages:
        def create(self, **kwargs):
            captured.update(kwargs)
            return SimpleNamespace(
                content=[SimpleNamespace(type="text", text='{"recommendation": "focus"}')]
            )

    fake_client = SimpleNamespace(messages=FakeMessages())
    monkeypatch.setattr(anthropic_client, "get_anthropic_client", lambda: fake_client)

    result = anthropic_client.call_claude_json("Return JSON", use_web_search=True)

    assert result == {"recommendation": "focus"}
    assert captured["tools"] == [
        {"type": "web_search_20250305", "name": "web_search", "max_uses": 3}
    ]


def test_call_claude_json_returns_empty_dict_for_malformed_json(monkeypatch) -> None:
    class FakeMessages:
        def create(self, **kwargs):
            return SimpleNamespace(content=[SimpleNamespace(type="text", text="not json")])

    fake_client = SimpleNamespace(messages=FakeMessages())
    monkeypatch.setattr(anthropic_client, "get_anthropic_client", lambda: fake_client)

    assert anthropic_client.call_claude_json("Return JSON") == {}


def test_anthropic_icp_client_uses_demo_fallback_when_web_search_breaks(monkeypatch) -> None:
    calls: list[bool] = []
    prompts: list[str] = []

    def fake_call(prompt: str, use_web_search: bool = False) -> dict[str, Any]:
        calls.append(use_web_search)
        prompts.append(prompt)
        if use_web_search:
            return {}
        return {"recommendation": "fallback"}

    company = analysis_pipeline._company_from_input(COMPANY_INPUT, "history")
    monkeypatch.setattr(anthropic_client, "call_claude_json", fake_call)

    result = anthropic_client.AnthropicICPClient().analyze(company)

    assert result == {"recommendation": "fallback"}
    assert calls == [True, False]
    assert "demo_market_data" in prompts[-1]


def test_prompt_builders_keep_route_specific_prompts_isolated() -> None:
    analysis_prompt = build_analysis_prompt(COMPANY_INPUT, has_history=True)
    refine_prompt = build_refine_prompt(COMPANY_INPUT, valid_agent_output(), "Focus logistics")
    action_plan_prompt = build_action_plan_prompt(COMPANY_INPUT, valid_agent_output())
    feedback_prompt = build_feedback_prompt(
        COMPANY_INPUT,
        valid_agent_output(),
        outcome="lost",
        reason="Buyer was not senior enough",
    )

    assert "Create an ICP recommendation" in analysis_prompt
    assert "exact top-level contract" in analysis_prompt
    assert "1 to 10" in analysis_prompt
    assert "Focus logistics" in refine_prompt
    assert "execution-ready sales action plan" in action_plan_prompt
    assert "message_variations" in action_plan_prompt
    assert "metrics_to_track" in action_plan_prompt
    assert "Buyer was not senior enough" in feedback_prompt


def test_run_full_analysis_returns_combined_outputs(monkeypatch) -> None:
    monkeypatch.setattr(
        analysis_pipeline,
        "call_claude_json",
        lambda prompt, use_web_search=False: valid_agent_output(),
    )

    result = analysis_pipeline.run_full_analysis(COMPANY_INPUT, mode="history")

    assert result["status"] == "completed"
    assert set(result["agent_output"]) == {
        "diagnosis",
        "external_benchmarks",
        "markets",
        "icp",
        "approach",
        "hypotheses_to_validate",
        "questions_for_human",
    }
    assert result["agent_output"]["icp"]["profile"].startswith("Mid-market manufacturing")
    assert "baseline_output" in result


def test_history_mode_enables_web_search(monkeypatch) -> None:
    calls: list[bool] = []

    def fake_call(prompt: str, use_web_search: bool = False) -> dict[str, Any]:
        calls.append(use_web_search)
        return valid_agent_output()

    monkeypatch.setattr(analysis_pipeline, "call_claude_json", fake_call)

    result = analysis_pipeline.run_full_analysis(COMPANY_INPUT, mode="history")

    assert result["status"] == "completed"
    assert calls == [True]


def test_no_history_mode_uses_demo_market_data_without_web_search(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def fake_call(prompt: str, use_web_search: bool = False) -> dict[str, Any]:
        captured["prompt"] = prompt
        captured["use_web_search"] = use_web_search
        return valid_agent_output()

    monkeypatch.setattr(analysis_pipeline, "call_claude_json", fake_call)

    result = analysis_pipeline.run_full_analysis(NO_HISTORY_COMPANY_INPUT, mode="no_history")

    assert result["status"] == "completed"
    assert captured["use_web_search"] is False
    assert "demo_market_data" in captured["prompt"]


def test_history_mode_falls_back_to_demo_market_data_when_web_search_breaks(monkeypatch) -> None:
    calls: list[bool] = []
    prompts: list[str] = []

    def fake_call(prompt: str, use_web_search: bool = False) -> dict[str, Any]:
        calls.append(use_web_search)
        prompts.append(prompt)
        if use_web_search:
            return {}
        return valid_agent_output()

    monkeypatch.setattr(analysis_pipeline, "call_claude_json", fake_call)

    result = analysis_pipeline.run_full_analysis(COMPANY_INPUT, mode="history")

    assert result["status"] == "completed"
    assert calls == [True, False]
    assert "demo_market_data" in prompts[-1]


def test_run_full_analysis_uses_deterministic_output_without_llm(monkeypatch) -> None:
    monkeypatch.setattr(
        analysis_pipeline,
        "call_claude_json",
        lambda prompt, use_web_search=False: {},
    )
    monkeypatch.setattr(analysis_pipeline.settings, "anthropic_api_key", None)

    result = analysis_pipeline.run_full_analysis(COMPANY_INPUT, mode="history")

    assert result["status"] == "completed"
    assert result["agent_output"]["icp"]["profile"]
    assert len(result["agent_output"]["markets"]) <= 3
    assert result["agent_output"]["approach"]["sample_message"]


def test_run_full_analysis_uses_deterministic_output_when_llm_returns_empty(
    monkeypatch,
) -> None:
    monkeypatch.setattr(
        analysis_pipeline,
        "call_claude_json",
        lambda prompt, use_web_search=False: {},
    )
    monkeypatch.setattr(analysis_pipeline.settings, "anthropic_api_key", "configured")

    result = analysis_pipeline.run_full_analysis(NO_HISTORY_COMPANY_INPUT, mode="no_history")

    assert result["status"] == "completed"
    assert result["agent_output"]["icp"]["profile"]
    assert result["agent_output"]["approach"]["sample_message"]


def test_run_full_analysis_retries_once_when_agent_output_is_invalid(monkeypatch) -> None:
    responses = iter([{"unexpected": "shape"}, valid_agent_output()])

    monkeypatch.setattr(
        analysis_pipeline,
        "call_claude_json",
        lambda prompt, use_web_search=False: next(responses),
    )

    result = analysis_pipeline.run_full_analysis(COMPANY_INPUT, mode="history")

    assert result["status"] == "completed"
    assert result["agent_output"]["icp"]["confidence"] == "high"


def test_run_full_analysis_raises_controlled_error_after_retry(monkeypatch) -> None:
    monkeypatch.setattr(
        analysis_pipeline,
        "call_claude_json",
        lambda prompt, use_web_search=False: {"unexpected": "shape"},
    )

    try:
        analysis_pipeline.run_full_analysis(COMPANY_INPUT, mode="history")
    except AgentOutputValidationError as exc:
        assert "after retry" in str(exc)
    else:
        raise AssertionError("Expected AgentOutputValidationError")


def test_validate_agent_output_rejects_invalid_scores() -> None:
    output = valid_agent_output()
    output["markets"][0]["scores"]["size"] = 11

    try:
        analysis_pipeline.validate_agent_output(
            output,
            analysis_pipeline._company_from_input(COMPANY_INPUT, "history"),
        )
    except AgentOutputValidationError as exc:
        assert "size" in str(exc)
    else:
        raise AssertionError("Expected AgentOutputValidationError")


def test_validate_agent_output_requires_diagnosis() -> None:
    output = valid_agent_output()
    del output["diagnosis"]

    try:
        analysis_pipeline.validate_agent_output(
            output,
            analysis_pipeline._company_from_input(COMPANY_INPUT, "history"),
        )
    except AgentOutputValidationError as exc:
        assert "diagnosis" in str(exc)
    else:
        raise AssertionError("Expected AgentOutputValidationError")


def test_validate_agent_output_rejects_invalid_icp_confidence() -> None:
    output = valid_agent_output()
    output["icp"]["confidence"] = "very high"

    try:
        analysis_pipeline.validate_agent_output(
            output,
            analysis_pipeline._company_from_input(COMPANY_INPUT, "history"),
        )
    except AgentOutputValidationError as exc:
        assert "confidence" in str(exc)
    else:
        raise AssertionError("Expected AgentOutputValidationError")


def test_validate_agent_output_rejects_too_many_markets() -> None:
    output = valid_agent_output()
    output["markets"] = output["markets"] * 4

    try:
        analysis_pipeline.validate_agent_output(
            output,
            analysis_pipeline._company_from_input(COMPANY_INPUT, "history"),
        )
    except AgentOutputValidationError as exc:
        assert "at most 3 items" in str(exc)
    else:
        raise AssertionError("Expected AgentOutputValidationError")


def test_validate_agent_output_requires_sample_message() -> None:
    output = valid_agent_output()
    del output["approach"]["sample_message"]

    try:
        analysis_pipeline.validate_agent_output(
            output,
            analysis_pipeline._company_from_input(COMPANY_INPUT, "history"),
        )
    except AgentOutputValidationError as exc:
        assert "sample_message" in str(exc)
    else:
        raise AssertionError("Expected AgentOutputValidationError")


def test_refine_analysis_and_generate_action_plan_use_claude_json(monkeypatch) -> None:
    action_plan = {
        "summary": "Prioritize downtime-heavy accounts.",
        "next_steps": [
            {
                "title": "Build target list",
                "owner": "Founder",
                "timeframe": "This week",
                "success_metric": "25 qualified accounts",
            }
        ],
        "risks": ["Accounts without clear downtime ownership"],
    }

    def fake_call(prompt: str, use_web_search: bool = False) -> dict[str, Any]:
        if "execution-ready sales action plan" in prompt:
            return action_plan
        return valid_agent_output()

    monkeypatch.setattr(analysis_pipeline, "call_claude_json", fake_call)

    refined = analysis_pipeline.refine_analysis(
        COMPANY_INPUT,
        valid_agent_output(),
        "Focus on logistics operators",
    )
    generated_plan = analysis_pipeline.generate_action_plan(COMPANY_INPUT, refined)

    assert refined["icp"]["confidence"] == "high"
    assert generated_plan == action_plan
