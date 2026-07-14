from app.schemas.company import CompanyCreate
from app.services.baseline_service import build_baseline


def test_baseline_is_generic() -> None:
    company = CompanyCreate(
        name="LedgerLoop",
        industry="Fintech",
        stage="Seed",
        description="Finance workflow automation for vendor payment reconciliation.",
    )
    baseline = build_baseline(company)
    assert "Fintech" in baseline["recommended_icp"]

