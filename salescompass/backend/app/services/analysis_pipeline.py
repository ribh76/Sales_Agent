from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable

from pydantic import ValidationError

from app.schemas.analysis import AnalysisResult, OutreachVariation, SegmentScore
from app.schemas.company import CompanyCreate
from app.services.anthropic_client import call_claude_json
from app.services.baseline_service import build_baseline
from app.services.prompts import (
    build_action_plan_prompt,
    build_analysis_prompt,
    build_refine_prompt,
)


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
    prompt = build_analysis_prompt(company.model_dump(mode="json"), company.has_customer_history)
    raw_output = call_claude_json(prompt)
    agent_output = validate_agent_output(raw_output, company)
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
    raw_output = call_claude_json(prompt)
    return validate_agent_output(raw_output or previous_output, company)


def generate_action_plan(
    company_input: dict[str, Any],
    agent_output: dict[str, Any],
) -> dict[str, Any]:
    prompt = build_action_plan_prompt(company_input, agent_output)
    action_plan = call_claude_json(prompt)
    if action_plan:
        return action_plan

    next_steps = agent_output.get("action_plan") or []
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
        "risks": agent_output.get("disqualifiers") or [],
    }


def validate_agent_output(raw_output: dict[str, Any], company: CompanyCreate) -> dict[str, Any]:
    try:
        return AnalysisResult.model_validate(raw_output).model_dump(mode="json")
    except (TypeError, ValidationError, ValueError):
        return _deterministic_analysis(company).model_dump(mode="json")


def generate_baseline(company_input: dict[str, Any], mode: str) -> dict[str, object]:
    return build_baseline(_company_from_input(company_input, mode))


def run_icp_analysis(company: CompanyCreate, use_llm: bool = True) -> AnalysisResult:
    if use_llm:
        result = run_full_analysis(company.model_dump(mode="json"), company.mode)
        return AnalysisResult.model_validate(result["agent_output"])

    return _deterministic_analysis(company)


def _company_from_input(company_input: dict[str, Any], mode: str | None) -> CompanyCreate:
    payload = dict(company_input)
    if mode is not None:
        payload["mode"] = mode
    return CompanyCreate.model_validate(payload)


def _optional_mode(company_input: dict[str, Any]) -> str | None:
    value = company_input.get("mode")
    return str(value) if value is not None else None


def _deterministic_analysis(company: CompanyCreate) -> AnalysisResult:
    scores = _score_segments(company)
    top = scores[0]
    confidence = _confidence(company, top.score)
    descriptor = _company_descriptor(company)

    return AnalysisResult(
        diagnosis=(
            f"{company.name} should narrow its first sales motion around {top.name.lower()}. "
            f"The strongest signals are {', '.join(top.evidence[:2]).lower()}."
        ),
        recommended_icp=f"{top.name} that are actively trying to solve {descriptor}.",
        confidence=confidence,
        market_scores=scores,
        disqualifiers=[
            "No named owner for the pain or no budget path within the next two quarters.",
            "Teams that see the problem as a nice-to-have productivity issue.",
            "Accounts that require heavy custom implementation before value is proven.",
        ],
        external_benchmarks=[
            "Prioritize segments where the pain can be measured in revenue, cost, cycle time, or risk.",
            "A narrow ICP should name the buyer, trigger event, pain metric, and likely buying motion.",
            "Early-stage teams should prefer fast learning loops over total addressable market breadth.",
        ],
        action_plan=[
            f"Interview five prospects from {top.name.lower()} and validate the trigger event.",
            "Rewrite the homepage hero around the sharpest quantified pain from those interviews.",
            "Build a 25-account target list with the same trigger signal and one disqualifier check.",
            "Run two outbound message variants and track reply quality, not just reply volume.",
        ],
        outreach=[
            OutreachVariation(
                title="Trigger-led opener",
                channel="Email",
                message=(
                    f"Noticed {company.name} helps with {descriptor}. Are you seeing teams delay "
                    "decisions because the pain is hard to quantify?"
                ),
            ),
            OutreachVariation(
                title="Operational pain note",
                channel="LinkedIn",
                message=(
                    f"For {top.name.lower()}, the costly part usually is not the task itself; "
                    "it is the repeated handoff friction around it. Worth comparing notes?"
                ),
            ),
            OutreachVariation(
                title="Proof request",
                channel="Call script",
                message=(
                    "The teams we are learning from usually have one metric they need to move "
                    "this quarter. What would make this problem board-level instead of background noise?"
                ),
            ),
        ],
        human_checkpoint=(
            "Before scaling outreach, confirm that the buyer owns a metric tied to the pain and "
            "can describe the cost of doing nothing."
        ),
        assumptions=_assumptions(company),
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


def _assumptions(company: CompanyCreate) -> list[str]:
    assumptions = [
        "The provided company description reflects the current product focus.",
        "The team can reach buyers directly enough to test messaging within 30 days.",
    ]
    if not company.has_customer_history:
        assumptions.append("Segment choice should be treated as a hypothesis until interviews validate it.")
    return assumptions


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
