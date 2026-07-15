from app.schemas.company import CompanyCreate
from app.services.baseline_service import build_baseline, extract_naive_segment, generate_baseline


def test_baseline_is_generic() -> None:
    company = CompanyCreate(
        name="LedgerLoop",
        industry="Fintech",
        stage="Seed",
        description="Finance workflow automation for vendor payment reconciliation.",
    )
    baseline = build_baseline(company)
    assert "Fintech" in baseline["recommended_icp"]


def test_generate_baseline_uses_most_common_current_market() -> None:
    baseline = generate_baseline(
        {
            "name": "Acme Ops",
            "industry": "Manufacturing consulting",
            "description": "Helps manufacturers reduce downtime.",
            "current_markets": "logistics, manufacturing, manufacturing",
        },
        mode="history",
    )

    assert baseline["segment"] == "manufacturing"
    assert baseline["icp"] == "Companies in manufacturing"
    assert baseline["confidence"] == "medium"
    assert baseline["outreach"]["channel"] == "cold email"


def test_extract_naive_segment_falls_back_to_stated_industry() -> None:
    segment = extract_naive_segment(
        {
            "industry": "Manufacturing consulting",
            "description": "Helps reduce line downtime.",
        },
        mode="history",
    )

    assert segment == "manufacturing"
