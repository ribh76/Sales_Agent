from app.schemas.company import CompanyCreate

SYSTEM_PROMPT = """You are SalesCompass, an ICP strategy agent for B2B teams.
Return concise, evidence-based recommendations. Make assumptions visible.
Never claim live market research unless explicit data is provided."""


def build_icp_prompt(company: CompanyCreate) -> str:
    history = company.analysis_history_text() or "No customer history provided."
    return f"""
Create an ICP recommendation for this company.

Company: {company.name}
Website: {company.website or "Unknown"}
Industry: {company.industry}
Mode: {company.mode}
Stage: {company.analysis_stage()}
Average ticket: {company.analysis_average_ticket() or "Unknown"}
Has customer history: {company.has_customer_history}
Description: {company.description}
Customer history: {history}

Return JSON matching the SalesCompass AnalysisResult contract.
"""
