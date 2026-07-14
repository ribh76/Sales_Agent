from __future__ import annotations

from dataclasses import dataclass


@dataclass
class CompanyProfile:
    name: str
    industry: str
    stage: str
    pain: str


def recommend_icp(profile: CompanyProfile) -> dict[str, object]:
    segment = "B2B teams with urgent revenue process pain"
    if "enablement" in profile.pain.lower():
        segment = "Revenue enablement leaders at scaling B2B SaaS companies"

    return {
        "company": profile.name,
        "recommended_icp": segment,
        "why_now": f"{profile.stage} companies in {profile.industry} need sharper prioritization.",
        "first_action": "Interview five recent won or nearly-won accounts and tag urgency signals.",
    }


if __name__ == "__main__":
    demo = CompanyProfile(
        name="Northstar Enablement",
        industry="B2B SaaS",
        stage="Series A",
        pain="Enablement team needs better onboarding and pipeline conversion.",
    )
    print(recommend_icp(demo))
