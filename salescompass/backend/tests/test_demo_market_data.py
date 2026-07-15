from app.services.demo_market_data import (
    DEMO_MARKET_SNIPPETS,
    build_demo_market_context,
    get_demo_market_snippet,
    get_demo_profile_key_by_id,
)
from app.schemas.company import CompanyCreate


def test_demo_market_snippets_cover_mvp_segments() -> None:
    assert set(DEMO_MARKET_SNIPPETS) == {
        "manufacturing",
        "healthcare",
        "logistics",
        "real estate",
    }
    assert DEMO_MARKET_SNIPPETS["manufacturing"]["sales_cycle"]


def test_demo_market_snippet_lookup_is_fuzzy() -> None:
    snippet = get_demo_market_snippet("mid-market logistics operators")

    assert snippet["competition"].startswith("Moderate competition")


def test_demo_market_context_uses_company_segments() -> None:
    company = CompanyCreate(
        name="Acme Ops Consulting",
        mode="no_history",
        industry="Manufacturing consulting",
        description="Helps manufacturers reduce downtime across production lines.",
        problem_solved="Downtime reduction",
        target_user_guess="Plant operations leaders",
        hypothetical_ticket=12000,
    )

    context = build_demo_market_context(company)

    assert context["source"] == "demo_market_data"
    assert context["segments"][0]["segment"] == "manufacturing"
    assert context["segments"][0]["sales_cycle"]


def test_seeded_demo_profiles_can_be_addressed_by_id() -> None:
    assert get_demo_profile_key_by_id(1) == "northstar-enablement"
