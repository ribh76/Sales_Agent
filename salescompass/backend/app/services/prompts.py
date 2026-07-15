import json
from typing import Any

from app.schemas.company import CompanyCreate

SYSTEM_PROMPT = """You are SalesCompass, an ICP strategy agent for B2B teams.
Return concise, evidence-based recommendations. Make assumptions visible.
Never claim live market research unless explicit data is provided.
Return only valid JSON. Do not wrap JSON in Markdown fences."""

ANALYSIS_JSON_CONTRACT = {
    "diagnosis": "string",
    "recommended_icp": "string",
    "confidence": "integer from 0 to 100",
    "market_scores": [
        {
            "name": "string",
            "score": "integer from 0 to 100",
            "fit": "integer from 0 to 100",
            "urgency": "integer from 0 to 100",
            "reachability": "integer from 0 to 100",
            "deal_quality": "integer from 0 to 100",
            "evidence": ["string"],
        }
    ],
    "disqualifiers": ["string"],
    "external_benchmarks": ["string"],
    "action_plan": ["string"],
    "outreach": [{"title": "string", "channel": "string", "message": "string"}],
    "human_checkpoint": "string",
    "assumptions": ["string"],
}


def build_analysis_prompt(company_input: dict[str, Any], has_history: bool) -> str:
    return f"""
Create an ICP recommendation for this B2B company.

Company input:
{_json(company_input)}

Has customer history: {str(has_history).lower()}

Reason from the provided company data. If evidence is thin, lower confidence and make the
assumptions explicit. Return only JSON matching this contract:
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


def build_icp_prompt(company: CompanyCreate) -> str:
    return build_analysis_prompt(company.model_dump(mode="json"), company.has_customer_history)


def _json(payload: Any) -> str:
    return json.dumps(payload, indent=2, sort_keys=True, default=str)
