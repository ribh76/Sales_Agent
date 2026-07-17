from sqlalchemy.orm import Session

from app.models.evaluation import EvaluationProfile
from app.services.demo_market_data import list_demo_profiles


def seed_evaluation_profiles(db: Session) -> None:
    for profile in list_demo_profiles():
        existing = (
            db.query(EvaluationProfile)
            .filter(EvaluationProfile.name == profile["key"])
            .first()
        )
        payload = {
            "name": profile["key"],
            "mode": profile["mode"],
            "profile_input": profile["profile_input"],
            "expected_confidence": profile["expected_confidence"],
            "thin_data_case": profile["thin_data_case"],
        }
        if existing is None:
            db.add(EvaluationProfile(**payload))
            continue

        for key, value in payload.items():
            setattr(existing, key, value)
    db.commit()


def main() -> None:
    for profile in list_demo_profiles():
        print(f"{profile['key']}: {profile['label']}")


if __name__ == "__main__":
    main()
