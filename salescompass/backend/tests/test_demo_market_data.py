from app.services.demo_market_data import (
    DEMO_MARKET_SNIPPETS,
    get_demo_market_snippet,
    get_demo_profile_key_by_id,
)


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


def test_seeded_demo_profiles_can_be_addressed_by_id() -> None:
    assert get_demo_profile_key_by_id(1) == "northstar-enablement"
