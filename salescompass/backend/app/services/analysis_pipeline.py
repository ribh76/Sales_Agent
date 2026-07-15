from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable

from pydantic import ValidationError

from app.core.config import settings
from app.schemas.analysis import AnalysisResult, SegmentScore
from app.schemas.company import CompanyCreate
from app.services.anthropic_client import call_claude_json
from app.services.baseline_service import build_baseline
from app.services.demo_market_data import build_demo_market_context
from app.services.prompts import (
    build_action_plan_prompt,
    build_analysis_prompt,
    build_refine_prompt,
)


class AgentOutputValidationError(RuntimeError):
    """Raised when the LLM cannot produce the required agent JSON contract."""


@dataclass(frozen=True)
class SegmentTemplate:
    name: str
    keywords: tuple[str, ...]
    base_fit: int
    base_urgency: int
    reachability: int
    deal_quality: int


SEGMENTS: tuple[SegmentTemplate, ...] = (
    SegmentTemplate(
        name="Revenue teams at scaling B2B SaaS companies",
        keywords=("sales", "revenue", "enablement", "pipeline", "saas", "onboard"),
        base_fit=76,
        base_urgency=72,
        reachability=80,
        deal_quality=78,
    ),
    SegmentTemplate(
        name="Operations leaders with measurable workflow bottlenecks",
        keywords=("workflow", "operations", "handoff", "automation", "process"),
        base_fit=70,
        base_urgency=74,
        reachability=70,
        deal_quality=73,
    ),
    SegmentTemplate(
        name="Finance teams under close or reconciliation pressure",
        keywords=("finance", "reconcile", "vendor", "month-end", "ledger", "payment"),
        base_fit=72,
        base_urgency=78,
        reachability=65,
        deal_quality=72,
    ),
    SegmentTemplate(
        name="Healthcare operators managing multi-site patient flow",
        keywords=("clinic", "patient", "healthcare", "scheduling", "no-show", "intake"),
        base_fit=73,
        base_urgency=75,
        reachability=58,
        deal_quality=82,
    ),
)


def run_full_analysis(company_input: dict[str, Any], mode: str) -> dict[str, Any]:
    company = _company_from_input(company_input, mode)
    use_web_search = _should_use_web_search(company)
    demo_market_context = build_demo_market_context(company)
    company_payload = company.model_dump(mode="json")
    prompt = build_analysis_prompt(
        company_payload,
        company.has_customer_history,
        use_web_search=use_web_search,
        market_context=None if use_web_search else demo_market_context,
    )
    fallback_prompt = build_analysis_prompt(
        company_payload,
        company.has_customer_history,
        market_context=demo_market_context,
        use_web_search=False,
    )
    agent_output = generate_agent_output(
        prompt,
        company,
        use_web_search=use_web_search,
        fallback_prompt=fallback_prompt,
    )
    baseline_output = generate_baseline(company.model_dump(mode="json"), company.mode)

    return {
        "status": "completed",
        "agent_output": agent_output,
        "baseline_output": baseline_output,
    }


def refine_analysis(
    company_input: dict[str, Any],
    previous_output: dict[str, Any],
    adjustment: str,
) -> dict[str, Any]:
    company = _company_from_input(company_input, _optional_mode(company_input))
    prompt = build_refine_prompt(company.model_dump(mode="json"), previous_output, adjustment)
    if not settings.anthropic_api_key:
        return validate_agent_output(previous_output, company)
    return generate_agent_output(prompt, company, use_web_search=_should_use_web_search(company))


def generate_action_plan(
    company_input: dict[str, Any],
    agent_output: dict[str, Any],
) -> dict[str, Any]:
    prompt = build_action_plan_prompt(company_input, agent_output)
    action_plan = call_claude_json(prompt)
    if action_plan:
        return action_plan

    hypotheses = agent_output.get("hypotheses_to_validate") or []
    questions = agent_output.get("questions_for_human") or []
    sample_message = (agent_output.get("approach") or {}).get("sample_message")
    next_steps = [
        f"Validate hypothesis: {hypothesis}" for hypothesis in hypotheses[:3]
    ] or ["Review the ICP recommendation and choose the first validation segment."]
    if sample_message:
        next_steps.append("Run the sample message with a small target account list.")
    return {
        "summary": "Execution plan generated from the latest ICP recommendation.",
        "next_steps": [
            {
                "title": step,
                "owner": "Founder",
                "timeframe": "Next 30 days",
                "success_metric": "Completed with evidence captured",
            }
            for step in next_steps
        ],
        "risks": questions,
    }


def generate_agent_output(
    prompt: str,
    company: CompanyCreate,
    use_web_search: bool = False,
    fallback_prompt: str | None = None,
) -> dict[str, Any]:
    raw_output = call_claude_json(prompt, use_web_search=use_web_search)
    if use_web_search and not raw_output:
        return _generate_from_demo_market_fallback(fallback_prompt or prompt, company)

    if not raw_output and not settings.anthropic_api_key:
        return _deterministic_analysis(company, build_demo_market_context(company)).model_dump(mode="json")

    try:
        return validate_agent_output(raw_output, company)
    except AgentOutputValidationError as first_error:
        retry_output = call_claude_json(prompt, use_web_search=use_web_search)
        if use_web_search and not retry_output:
            return _generate_from_demo_market_fallback(fallback_prompt or prompt, company)

        try:
            return validate_agent_output(retry_output, company)
        except AgentOutputValidationError as second_error:
            raise AgentOutputValidationError(
                f"Agent output failed validation after retry: {second_error}"
            ) from first_error


def validate_agent_output(raw_output: dict[str, Any], company: CompanyCreate) -> dict[str, Any]:
    try:
        return AnalysisResult.model_validate(raw_output).model_dump(mode="json")
    except (TypeError, ValidationError, ValueError) as exc:
        raise AgentOutputValidationError(str(exc)) from exc


def _generate_from_demo_market_fallback(prompt: str, company: CompanyCreate) -> dict[str, Any]:
    raw_output = call_claude_json(prompt, use_web_search=False)
    if not raw_output and not settings.anthropic_api_key:
        return _deterministic_analysis(company, build_demo_market_context(company)).model_dump(mode="json")

    try:
        return validate_agent_output(raw_output, company)
    except AgentOutputValidationError as first_error:
        retry_output = call_claude_json(prompt, use_web_search=False)
        try:
            return validate_agent_output(retry_output, company)
        except AgentOutputValidationError as second_error:
            raise AgentOutputValidationError(
                f"Agent output failed validation after demo market fallback: {second_error}"
            ) from first_error


def generate_baseline(company_input: dict[str, Any], mode: str) -> dict[str, object]:
    return build_baseline(_company_from_input(company_input, mode))


def run_icp_analysis(company: CompanyCreate, use_llm: bool = True) -> AnalysisResult:
    if use_llm:
        result = run_full_analysis(company.model_dump(mode="json"), company.mode)
        return AnalysisResult.model_validate(result["agent_output"])

    return _deterministic_analysis(company)


def _should_use_web_search(company: CompanyCreate) -> bool:
    return company.mode == "history"


def _company_from_input(company_input: dict[str, Any], mode: str | None) -> CompanyCreate:
    payload = dict(company_input)
    if mode is not None:
        payload["mode"] = mode
    return CompanyCreate.model_validate(payload)


def _optional_mode(company_input: dict[str, Any]) -> str | None:
    value = company_input.get("mode")
    return str(value) if value is not None else None


def _deterministic_analysis(
    company: CompanyCreate,
    market_context: dict[str, Any] | None = None,
) -> AnalysisResult:
    scores = _score_segments(company)
    top = scores[0]
    confidence = _confidence_label(company, top.score)
    descriptor = _company_descriptor(company)
    context = market_context or build_demo_market_context(company)

    return AnalysisResult(
        diagnosis=(
            f"{company.name} should narrow its first sales motion around {top.name.lower()}. "
            f"The strongest signals are {', '.join(top.evidence[:2]).lower()}."
        ),
        external_benchmarks=_external_benchmarks(context),
        markets=[_market_from_score(score, context) for score in scores[:3]],
        icp={
            "profile": f"{top.name} that are actively trying to solve {descriptor}.",
            "company_size": "Mid-market or focused growth teams",
            "target_industry": company.industry,
            "region": "Start with reachable markets from the current network",
            "decision_maker": _decision_maker(company),
            "main_pain": descriptor,
            "rationale": "The top segment combines fit, urgency, reachability, and deal quality signals.",
            "confidence": confidence,
            "confidence_basis": "Customer history and input specificity determine confidence.",
        },
        approach={
            "channel": "Email",
            "trigger": "A measurable pain tied to a current operating priority",
            "first_contact": _decision_maker(company),
            "message_tone": "Specific, evidence-led, and concise",
            "sample_message": (
                f"Noticed {company.name} helps with {descriptor}. Are teams in your org "
                "actively trying to quantify that pain this quarter?"
            ),
            "confidence": confidence,
            "confidence_basis": "Message should be tested against reply quality before scaling.",
        },
        hypotheses_to_validate=[
            f"{top.name} has an urgent enough pain to prioritize {company.name}.",
            "The buyer owns a metric tied to the pain and can describe the cost of inaction.",
            "A narrow target list produces higher-quality replies than broad segment outreach.",
        ],
        questions_for_human=[
            "Which buyer role feels the pain most directly today?",
            "What trigger event makes this problem urgent now?",
            "What proof would make this ICP safe to scale beyond the first test list?",
        ],
    )


def _score_segments(company: CompanyCreate) -> list[SegmentScore]:
    stage = company.analysis_stage()
    history_text = company.analysis_history_text()
    text = " ".join(
        part
        for part in [
            company.name,
            company.industry,
            stage,
            company.description,
            history_text,
        ]
        if part
    ).lower()

    results: list[SegmentScore] = []
    for segment in SEGMENTS:
        keyword_hits = [keyword for keyword in segment.keywords if keyword in text]
        history_bonus = 7 if company.has_customer_history else 0
        acv_bonus = _acv_bonus(company.analysis_average_ticket())
        stage_bonus = _stage_bonus(stage)

        fit = _clamp(segment.base_fit + len(keyword_hits) * 4 + history_bonus)
        urgency = _clamp(segment.base_urgency + len(keyword_hits) * 3 + stage_bonus)
        reachability = _clamp(segment.reachability + (5 if company.website or company.early_leads else 0))
        deal_quality = _clamp(segment.deal_quality + acv_bonus)
        score = round(fit * 0.35 + urgency * 0.3 + reachability * 0.15 + deal_quality * 0.2)

        evidence = _evidence(company, keyword_hits, stage_bonus, acv_bonus)
        results.append(
            SegmentScore(
                name=segment.name,
                score=score,
                fit=fit,
                urgency=urgency,
                reachability=reachability,
                deal_quality=deal_quality,
                evidence=evidence,
            )
        )

    return sorted(results, key=lambda item: item.score, reverse=True)


def _evidence(
    company: CompanyCreate, keyword_hits: Iterable[str], stage_bonus: int, acv_bonus: int
) -> list[str]:
    stage = company.analysis_stage()
    evidence = []
    hits = list(keyword_hits)
    if hits:
        evidence.append(f"Input mentions {', '.join(hits[:4])}")
    if company.has_customer_history and company.analysis_history_text():
        evidence.append("Customer history gives usable pattern evidence")
    else:
        evidence.append("No customer history means confidence depends on pain clarity")
    if stage_bonus:
        evidence.append(f"{stage} mode suggests urgency to focus GTM")
    if acv_bonus:
        evidence.append("Contract value can support a targeted sales motion")
    return evidence[:4]


def _confidence(company: CompanyCreate, top_score: int) -> int:
    confidence = min(88, max(45, top_score))
    if company.has_customer_history and company.analysis_history_text():
        confidence += 6
    if not company.analysis_average_ticket():
        confidence -= 5
    return _clamp(confidence)


def _confidence_label(company: CompanyCreate, top_score: int) -> str:
    confidence = _confidence(company, top_score)
    if confidence >= 75:
        return "high"
    if confidence >= 50:
        return "medium"
    return "low"


def _external_benchmarks(market_context: dict[str, Any]) -> list[dict[str, str]]:
    benchmarks = [
        {
            "stat": "Prioritize segments where the pain can be measured in revenue, cost, cycle time, or risk.",
            "source": "SalesCompass ICP heuristic",
        },
        {
            "stat": "A narrow ICP should name the buyer, trigger event, pain metric, and likely buying motion.",
            "source": "SalesCompass ICP heuristic",
        },
    ]

    for segment in _market_context_segments(market_context):
        benchmarks.append(
            {
                "stat": (
                    f"{segment['segment']}: {segment['market_size']} "
                    f"{segment['sales_cycle']} {segment['competition']}"
                ),
                "source": str(market_context.get("source", "demo_market_data")),
            }
        )

    return benchmarks[:3]


def _market_from_score(score: SegmentScore, market_context: dict[str, Any]) -> dict[str, Any]:
    snippet = _matching_market_context(score.name, market_context)
    rationale = " ".join(score.evidence)
    if snippet:
        rationale = (
            f"{rationale} Demo market data: {snippet['market_size']} "
            f"{snippet['sales_cycle']} {snippet['competition']}"
        )

    return {
        "name": score.name,
        "scores": {
            "size": _score_to_ten(score.score),
            "access": _score_to_ten(score.reachability),
            "ticket": _score_to_ten(score.deal_quality),
            "cycle": _score_to_ten(score.urgency),
            "competition": _score_to_ten(score.fit),
        },
        "total": _score_to_ten(score.score),
        "rationale": rationale,
    }


def _matching_market_context(
    market_name: str,
    market_context: dict[str, Any],
) -> dict[str, str] | None:
    normalized_name = market_name.lower()
    for segment in _market_context_segments(market_context):
        segment_name = segment["segment"].lower()
        if segment_name in normalized_name or normalized_name in segment_name:
            return segment
    segments = _market_context_segments(market_context)
    return segments[0] if segments else None


def _market_context_segments(market_context: dict[str, Any]) -> list[dict[str, str]]:
    segments = market_context.get("segments")
    if not isinstance(segments, list):
        return []

    normalized_segments = []
    for segment in segments:
        if not isinstance(segment, dict):
            continue
        if {"segment", "market_size", "sales_cycle", "competition"}.issubset(segment):
            normalized_segments.append(
                {
                    "segment": str(segment["segment"]),
                    "market_size": str(segment["market_size"]),
                    "sales_cycle": str(segment["sales_cycle"]),
                    "competition": str(segment["competition"]),
                }
            )
    return normalized_segments


def _score_to_ten(value: int) -> int:
    return max(1, min(10, round(value / 10)))


def _decision_maker(company: CompanyCreate) -> str:
    text = f"{company.industry} {company.description}".lower()
    if "sales" in text or "pipeline" in text or "revenue" in text:
        return "VP Sales or revenue leader"
    if "finance" in text or "reconcile" in text:
        return "Finance operations leader"
    if "patient" in text or "clinic" in text or "healthcare" in text:
        return "Operations leader"
    return "Business owner for the target pain"


def _company_descriptor(company: CompanyCreate) -> str:
    text = company.description.lower()
    if "pipeline" in text:
        return "pipeline conversion and sales execution risk"
    if "reconcile" in text or "finance" in text:
        return "reconciliation delays and close-process drag"
    if "patient" in text or "clinic" in text:
        return "patient flow, no-shows, and operational handoffs"
    if "workflow" in text or "automation" in text:
        return "manual workflow drag across teams"
    return "a costly operational problem with a named owner"


def _stage_bonus(stage: str) -> int:
    normalized = stage.lower()
    if "series" in normalized or "growth" in normalized:
        return 6
    if "seed" in normalized:
        return 3
    return 0


def _acv_bonus(acv: float | None) -> int:
    if acv is None:
        return 0
    if acv >= 30000:
        return 8
    if acv >= 10000:
        return 5
    return 2


def _clamp(value: int) -> int:
    return max(0, min(100, value))
