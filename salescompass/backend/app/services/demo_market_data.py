from app.schemas.company import CompanyCreate

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
