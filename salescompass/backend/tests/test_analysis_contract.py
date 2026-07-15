from app.schemas.company import CompanyCreate
from app.services.analysis_pipeline import run_icp_analysis


def test_analysis_returns_ranked_segments() -> None:
    company = CompanyCreate(
        name="Northstar Enablement",
        industry="B2B SaaS",
        stage="Series A",
        average_contract_value=18000,
        description="Sales enablement for pipeline coaching and rep onboarding.",
        has_customer_history=True,
        customer_history="Wins with revenue teams at scaling SaaS companies.",
    )
    result = run_icp_analysis(company, use_llm=False)
    assert result.markets[0].total >= result.markets[-1].total
    assert result.icp.profile
    assert result.icp.confidence in {"low", "medium", "high"}
