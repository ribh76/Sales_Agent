from app.schemas.company import CompanyCreate


def build_baseline(company: CompanyCreate) -> dict[str, object]:
    stage = company.analysis_stage()
    return {
        "recommended_icp": f"{company.industry} companies in {stage} mode",
        "confidence": 52,
        "rationale": (
            "This baseline uses only industry and data mode, so it is intentionally broad "
            "and does not inspect trigger events, buyer ownership, or customer patterns."
        ),
        "next_step": "Create a broad prospect list and test messaging across several buyer personas.",
    }
