from __future__ import annotations

import re
from collections import Counter
from typing import Any

from app.schemas.company import CompanyCreate

SEGMENT_SIGNAL_FIELDS = ("early_leads", "current_markets")
FALLBACK_SEGMENT_FIELDS = ("industry", "problem_solved", "target_user_guess", "description")

CANONICAL_SEGMENTS = {
    "manufacturing": ("manufacturing", "manufacturer", "manufacturers", "industrial"),
    "healthcare": ("healthcare", "health care", "clinic", "clinics", "patient"),
    "logistics": ("logistics", "supply chain", "shipping", "freight"),
    "real estate": ("real estate", "property", "brokerage", "realtor"),
    "finance": ("finance", "fintech", "accounting", "reconciliation", "payments"),
    "b2b saas": ("b2b saas", "saas", "software"),
}

SEGMENT_NOISE_WORDS = {
    "companies",
    "company",
    "consulting",
    "customers",
    "early",
    "enterprise",
    "firms",
    "industry",
    "leaders",
    "market",
    "markets",
    "mid",
    "midmarket",
    "operators",
    "services",
    "teams",
    "vendors",
}


def generate_baseline(company_input: dict[str, Any], mode: str) -> dict[str, object]:
    segment = extract_naive_segment(company_input, mode)
    rationale = (
        "Naively selected based on the most common mentioned segment."
        if _has_segment_signals(company_input)
        else "Naively selected based on the stated industry or problem category."
    )

    return {
        "segment": segment,
        "icp": f"Companies in {segment}",
        "rationale": rationale,
        "confidence": "medium",
        "outreach": {
            "channel": "cold email",
            "message": (
                f"Hi, we help companies in {segment} identify better-fit buyers and "
                "prioritize the accounts most likely to convert. Worth a quick conversation?"
            ),
        },
        "recommended_icp": _legacy_recommended_icp(company_input, segment),
        "next_step": "Send a generic cold email to a broad list in the selected segment.",
    }


def extract_naive_segment(company_input: dict[str, Any], mode: str) -> str:
    signal_segments = _extract_segments_from_fields(company_input, SEGMENT_SIGNAL_FIELDS)
    if signal_segments:
        return _most_common_first_mentioned(signal_segments)

    fallback_segments = _extract_segments_from_fields(company_input, FALLBACK_SEGMENT_FIELDS)
    if fallback_segments:
        return fallback_segments[0]

    return "early-stage companies" if mode == "no_history" else "target companies"


def build_baseline(company: CompanyCreate) -> dict[str, object]:
    return generate_baseline(company.model_dump(mode="json"), company.mode)


def _has_segment_signals(company_input: dict[str, Any]) -> bool:
    return any(bool(company_input.get(field)) for field in SEGMENT_SIGNAL_FIELDS)


def _extract_segments_from_fields(
    company_input: dict[str, Any],
    fields: tuple[str, ...],
) -> list[str]:
    segments: list[str] = []
    for field in fields:
        segments.extend(_extract_segments(company_input.get(field)))
    return segments


def _extract_segments(value: Any) -> list[str]:
    if value is None:
        return []

    if isinstance(value, dict):
        items: list[str] = []
        for nested_value in value.values():
            items.extend(_extract_segments(nested_value))
        return items

    if isinstance(value, list | tuple | set):
        items = []
        for nested_value in value:
            items.extend(_extract_segments(nested_value))
        return items

    return [
        segment
        for part in re.split(r"[,;\n/]| and ", str(value), flags=re.IGNORECASE)
        if (segment := _normalize_segment(part))
    ]


def _normalize_segment(raw_value: str) -> str:
    value = re.sub(r"[^a-zA-Z0-9& ]+", " ", raw_value).strip().lower()
    value = re.sub(r"\s+", " ", value)
    if not value:
        return ""

    for canonical, keywords in CANONICAL_SEGMENTS.items():
        if any(keyword in value for keyword in keywords):
            return canonical

    words = [word for word in value.split() if word not in SEGMENT_NOISE_WORDS]
    if not words:
        return value
    return " ".join(words[:3])


def _most_common_first_mentioned(segments: list[str]) -> str:
    counts = Counter(segments)
    return max(segments, key=lambda segment: counts[segment])


def _legacy_recommended_icp(company_input: dict[str, Any], segment: str) -> str:
    industry = company_input.get("industry")
    if isinstance(industry, str) and _normalize_segment(industry) == segment:
        return f"Companies in {industry}"
    return f"Companies in {segment}"
