from app.schemas.company import CompanyCreate

DEMO_MARKET_SNIPPETS: dict[str, dict[str, str]] = {
    "manufacturing": {
        "market_size": "Large industrial market with recurring operational pain.",
        "sales_cycle": "Typically 30-90 days for mid-market services.",
        "competition": "Moderate competition from consultants and software vendors.",
    },
    "healthcare": {
        "market_size": "Large regulated market with persistent workflow and access pressure.",
        "sales_cycle": "Typically 60-180 days depending on compliance and procurement needs.",
        "competition": "High competition from vertical SaaS vendors and services firms.",
    },
    "logistics": {
        "market_size": "Large operational market with recurring cost, routing, and visibility pain.",
        "sales_cycle": "Typically 30-120 days for mid-market operations teams.",
        "competition": "Moderate competition from point solutions, brokers, and consultants.",
    },
    "real estate": {
        "market_size": "Cyclical but large market with fragmented operators and local workflows.",
        "sales_cycle": "Typically 30-90 days for teams with clear transaction or leasing pain.",
        "competition": "Moderate competition from brokerage tools, CRMs, and service providers.",
    },
}

DEMO_PROFILES: dict[str, dict[str, object]] = {
    "northstar-enablement": {
        "key": "northstar-enablement",
        "label": "Northstar Enablement",
        "mode": "history",
        "expected_confidence": "high",
        "thin_data_case": False,
        "company": CompanyCreate(
            name="Northstar Enablement",
            website="https://northstar.example",
            industry="B2B SaaS",
            mode="history",
            stage="Series A",
            average_contract_value=18000,
            has_customer_history=True,
            description=(
                "Sales enablement software that helps revenue teams onboard reps faster, "
                "standardize discovery, and coach managers on pipeline quality."
            ),
            customer_history=(
                "Best customers are 80-300 employee SaaS companies with new sales managers, "
                "ramp-time pain, and board pressure to improve conversion."
            ),
        ),
    },
    "ledgerloop": {
        "key": "ledgerloop",
        "label": "LedgerLoop",
        "mode": "no_history",
        "expected_confidence": "medium",
        "thin_data_case": True,
        "company": CompanyCreate(
            name="LedgerLoop",
            website="https://ledgerloop.example",
            industry="Fintech",
            mode="no_history",
            stage="Seed",
            average_contract_value=9000,
            has_customer_history=False,
            description=(
                "Workflow automation for finance teams that reconcile vendor payments and "
                "handle month-end close across disconnected tools."
            ),
            customer_history=None,
        ),
    },
    "clinicflow": {
        "key": "clinicflow",
        "label": "ClinicFlow",
        "mode": "history",
        "expected_confidence": "high",
        "thin_data_case": False,
        "company": CompanyCreate(
            name="ClinicFlow",
            website="https://clinicflow.example",
            industry="Healthcare operations",
            mode="history",
            stage="Series B",
            average_contract_value=42000,
            has_customer_history=True,
            description=(
                "Patient intake and scheduling platform for multi-location outpatient clinics "
                "that need fewer no-shows and cleaner handoffs."
            ),
            customer_history=(
                "Strongest wins came from regional clinics with ten or more locations, "
                "centralized operations, and measurable wait-time targets."
            ),
        ),
    },
}


def get_demo_market_snippet(segment: str) -> dict[str, str]:
    normalized = segment.strip().lower()
    if normalized in DEMO_MARKET_SNIPPETS:
        return DEMO_MARKET_SNIPPETS[normalized]

    for key, snippet in DEMO_MARKET_SNIPPETS.items():
        if key in normalized or normalized in key:
            return snippet

    return {}


def build_demo_market_context(company: CompanyCreate) -> dict[str, object]:
    segments = []
    for segment in _candidate_segments(company):
        snippet = get_demo_market_snippet(segment)
        if snippet:
            normalized = _normalize_demo_segment(segment)
            if normalized not in {item["segment"] for item in segments}:
                segments.append({"segment": normalized, **snippet})

    if not segments:
        segments.append(
            {
                "segment": "general",
                "market_size": "Use a narrow, testable market definition until stronger evidence is available.",
                "sales_cycle": "Assume a short validation cycle before committing to a scaled sales motion.",
                "competition": "Validate alternatives directly with prospects before positioning against competitors.",
            }
        )

    return {
        "source": "demo_market_data",
        "segments": segments[:3],
    }


def _candidate_segments(company: CompanyCreate) -> list[str]:
    values = [
        company.industry,
        company.description,
        company.current_markets,
        company.early_leads,
        company.known_competitors,
        company.problem_solved,
        company.target_user_guess,
    ]
    candidates: list[str] = []
    for value in values:
        candidates.extend(_flatten_market_values(value))
    return candidates


def _flatten_market_values(value: object) -> list[str]:
    if value is None:
        return []

    if isinstance(value, dict):
        items: list[str] = []
        for nested_value in value.values():
            items.extend(_flatten_market_values(nested_value))
        return items

    if isinstance(value, list | tuple | set):
        items = []
        for nested_value in value:
            items.extend(_flatten_market_values(nested_value))
        return items

    return [str(value)]


def _normalize_demo_segment(segment: str) -> str:
    normalized = segment.strip().lower()
    for key in DEMO_MARKET_SNIPPETS:
        if key in normalized or normalized in key:
            return key
    return normalized


def get_demo_profile_key_by_id(profile_id: int) -> str:
    keys = list(DEMO_PROFILES)
    index = profile_id - 1
    if index < 0 or index >= len(keys):
        raise KeyError(profile_id)
    return keys[index]


def list_demo_profiles() -> list[dict[str, object]]:
    profiles = []
    for profile in DEMO_PROFILES.values():
        company = profile["company"]
        profiles.append(
            {
                **profile,
                "profile_input": company.to_model_dict(),  # type: ignore[union-attr]
            }
        )
    return profiles


def get_demo_profile(key: str) -> CompanyCreate:
    profile = DEMO_PROFILES.get(key)
    if profile is None:
        raise KeyError(key)
    return profile["company"]  # type: ignore[return-value]


def get_demo_profile_metadata(key: str) -> dict[str, object]:
    profile = DEMO_PROFILES.get(key)
    if profile is None:
        raise KeyError(key)
    company = profile["company"]
    return {
        **profile,
        "profile_input": company.to_model_dict(),  # type: ignore[union-attr]
    }
