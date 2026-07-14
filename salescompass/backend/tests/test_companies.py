from app.schemas.company import CompanyCreate


def test_company_contract_accepts_history() -> None:
    company = CompanyCreate(
        name="Northstar Enablement",
        industry="B2B SaaS",
        stage="Series A",
        description="A sales enablement platform for onboarding and coaching revenue teams.",
        has_customer_history=True,
        customer_history="Best accounts are scaling SaaS teams with new sales managers.",
    )
    assert company.has_customer_history is True

