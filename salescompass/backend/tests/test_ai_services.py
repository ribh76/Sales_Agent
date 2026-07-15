from types import SimpleNamespace
from typing import Any

from app.services import analysis_pipeline
from app.services import anthropic_client
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


def valid_agent_output() -> dict[str, Any]:
    return {
        "diagnosis": "Acme should focus on manufacturers with downtime reduction mandates.",
        "recommended_icp": "Mid-market manufacturing operators with measurable downtime pain.",
        "confidence": 82,
        "market_scores": [
            {
                "name": "Mid-market manufacturers",
                "score": 84,
                "fit": 86,
                "urgency": 82,
                "reachability": 78,
                "deal_quality": 88,
                "evidence": ["Past clients include mid-market manufacturers"],
            }
        ],
        "disqualifiers": ["No downtime metric owner"],
        "external_benchmarks": ["Prioritize segments with measurable operational pain"],
        "action_plan": ["Interview five plant operations leaders"],
        "outreach": [
            {
                "title": "Downtime trigger",
                "channel": "Email",
                "message": "Are downtime targets changing your operating priorities this quarter?",
            }
        ],
        "human_checkpoint": "Validate that the buyer owns downtime reduction.",
        "assumptions": ["The input reflects current GTM focus"],
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
    assert "Focus logistics" in refine_prompt
    assert "execution-ready sales action plan" in action_plan_prompt
    assert "Buyer was not senior enough" in feedback_prompt


def test_run_full_analysis_returns_combined_outputs(monkeypatch) -> None:
    monkeypatch.setattr(
        analysis_pipeline,
        "call_claude_json",
        lambda prompt, use_web_search=False: valid_agent_output(),
    )

    result = analysis_pipeline.run_full_analysis(COMPANY_INPUT, mode="history")

    assert result["status"] == "completed"
    assert result["agent_output"]["recommended_icp"].startswith("Mid-market manufacturing")
    assert "baseline_output" in result


def test_run_full_analysis_falls_back_when_agent_output_is_invalid(monkeypatch) -> None:
    monkeypatch.setattr(
        analysis_pipeline,
        "call_claude_json",
        lambda prompt, use_web_search=False: {"unexpected": "shape"},
    )

    result = analysis_pipeline.run_full_analysis(COMPANY_INPUT, mode="history")

    assert result["status"] == "completed"
    assert result["agent_output"]["recommended_icp"]
    assert result["agent_output"]["market_scores"]


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

    assert refined["confidence"] == 82
    assert generated_plan == action_plan
