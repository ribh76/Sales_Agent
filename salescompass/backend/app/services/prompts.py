import json
from typing import Any

from app.schemas.company import CompanyCreate

SYSTEM_PROMPT = """You are SalesCompass, an ICP strategy agent for B2B teams.
Return concise, evidence-based recommendations. Make assumptions visible.
Never claim live market research unless explicit data is provided.
Return only valid JSON. Do not wrap JSON in Markdown fences."""

ANALYSIS_JSON_CONTRACT = {
    "diagnosis": "string",
    "external_benchmarks": [
        {
            "stat": "string",
            "source": "string",
        }
    ],
    "markets": [
        {
            "name": "string",
            "scores": {
                "size": "integer from 1 to 10",
                "access": "integer from 1 to 10",
                "ticket": "integer from 1 to 10",
                "cycle": "integer from 1 to 10",
                "competition": "integer from 1 to 10",
            },
            "total": "integer from 1 to 10",
            "rationale": "string",
        }
    ],
    "icp": {
        "profile": "string",
        "company_size": "string",
        "target_industry": "string",
        "region": "string",
        "decision_maker": "string",
        "main_pain": "string",
        "rationale": "string",
        "confidence": "low, medium, or high",
        "confidence_basis": "string",
    },
    "approach": {
        "channel": "string",
        "trigger": "string",
        "first_contact": "string",
        "message_tone": "string",
        "sample_message": "string",
        "confidence": "low, medium, or high",
        "confidence_basis": "string",
    },
    "hypotheses_to_validate": ["string"],
    "questions_for_human": ["string"],
}


def build_analysis_prompt(
    company_input: dict[str, Any],
    has_history: bool,
    market_context: dict[str, Any] | None = None,
    use_web_search: bool = False,
) -> str:
    market_context_section = ""
    if market_context:
        market_context_section = f"""
Market context:
{_json(market_context)}

Use this market context as supporting evidence. If it is demo_market_data, treat it as a
fallback/demo reference rather than live market research.
"""
    elif use_web_search:
        market_context_section = """
Use web search to supplement current market benchmarks. Keep claims concise and source-aware.
If search evidence is weak or unavailable, keep confidence conservative.
"""

    return f"""
Create an ICP recommendation for this B2B company.

Company input:
{_json(company_input)}

Has customer history: {str(has_history).lower()}
{market_context_section}

Reason from the provided company data. Return at most three markets. Every value inside each
market's scores object must be an integer from 1 to 10. If evidence is thin, set icp.confidence
to low or medium and make the assumptions explicit in hypotheses_to_validate. Return only JSON
matching this exact top-level contract:
{_json(ANALYSIS_JSON_CONTRACT)}
"""


def build_refine_prompt(
    company_input: dict[str, Any], previous_output: dict[str, Any], adjustment: str
) -> str:
    return f"""
Refine the previous SalesCompass ICP recommendation.

Company input:
{_json(company_input)}

Previous agent output:
{_json(previous_output)}

Requested adjustment:
{adjustment}

Keep useful prior evidence, incorporate the requested adjustment, and return only JSON matching
the SalesCompass analysis contract:
{_json(ANALYSIS_JSON_CONTRACT)}
"""


def build_action_plan_prompt(company_input: dict[str, Any], agent_output: dict[str, Any]) -> str:
    return f"""
Turn this ICP recommendation into an execution-ready sales action plan.

Company input:
{_json(company_input)}

Agent output:
{_json(agent_output)}

Return only JSON with this shape:
{{
  "summary": "string",
  "next_steps": [
    {{
      "title": "string",
      "owner": "string",
      "timeframe": "string",
      "success_metric": "string"
    }}
  ],
  "message_variations": [
    {{
      "title": "string",
      "channel": "string",
      "message": "string"
    }}
  ],
  "metrics_to_track": ["string"],
  "risks": ["string"]
}}
"""


def build_feedback_prompt(
    company_input: dict[str, Any],
    agent_output: dict[str, Any],
    outcome: str,
    reason: str,
) -> str:
    return f"""
Use this human outcome feedback to improve future ICP recommendations.

Company input:
{_json(company_input)}

Agent output:
{_json(agent_output)}

Outcome: {outcome}
Reason: {reason}

Return only JSON with this shape:
{{
  "feedback_summary": "string",
  "icp_adjustments": ["string"],
  "learning": "string",
  "confidence_delta": "integer from -20 to 20"
}}
"""


def build_icp_prompt(
    company: CompanyCreate,
    market_context: dict[str, Any] | None = None,
    use_web_search: bool = False,
) -> str:
    return build_analysis_prompt(
        company.model_dump(mode="json"),
        company.has_customer_history,
        market_context=market_context,
        use_web_search=use_web_search,
    )


def _json(payload: Any) -> str:
    return json.dumps(payload, indent=2, sort_keys=True, default=str)
