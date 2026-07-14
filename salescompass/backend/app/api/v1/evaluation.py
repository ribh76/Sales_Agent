from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.errors import not_found
from app.db.session import get_db
from app.models.evaluation import EvaluationProfile as EvaluationProfileModel
from app.models.evaluation import EvaluationResult as EvaluationResultModel
from app.schemas.evaluation import EvaluationProfile, EvaluationResult, EvaluationRunRequest
from app.services.demo_market_data import get_demo_profile, get_demo_profile_metadata, list_demo_profiles
from app.services.evaluation_service import evaluate_profile

router = APIRouter()


@router.get("/profiles", response_model=list[EvaluationProfile])
def profiles() -> list[dict[str, object]]:
    return list_demo_profiles()


@router.post("/run", response_model=EvaluationResult)
def run_evaluation(payload: EvaluationRunRequest, db: Session = Depends(get_db)) -> EvaluationResultModel:
    try:
        company = get_demo_profile(payload.profile_key)
        metadata = get_demo_profile_metadata(payload.profile_key)
    except KeyError:
        raise not_found("Evaluation profile not found") from None

    profile = (
        db.query(EvaluationProfileModel)
        .filter(EvaluationProfileModel.name == payload.profile_key)
        .first()
    )
    if profile is None:
        profile = EvaluationProfileModel(
            name=payload.profile_key,
            mode=metadata["mode"],
            profile_input=metadata["profile_input"],
            expected_confidence=metadata["expected_confidence"],
            thin_data_case=metadata["thin_data_case"],
        )
        db.add(profile)
        db.flush()

    result = evaluate_profile(
        payload.profile_key,
        company,
        expected_confidence=metadata["expected_confidence"],
    )
    row = EvaluationResultModel(evaluation_profile_id=profile.id, **result)
    db.add(row)
    db.commit()
    db.refresh(row)
    row.evaluation_profile = profile
    return row
