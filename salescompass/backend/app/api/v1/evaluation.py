from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from starlette.concurrency import run_in_threadpool

from app.core.errors import not_found
from app.db.session import get_db
from app.models.evaluation import EvaluationProfile as EvaluationProfileModel
from app.models.evaluation import EvaluationResult as EvaluationResultModel
from app.schemas.evaluation import (
    EvaluationProfile,
    EvaluationRateRequest,
    EvaluationResult,
    EvaluationRunRequest,
    EvaluationSummary,
)
from app.services.demo_market_data import get_demo_profile, get_demo_profile_metadata, list_demo_profiles
from app.services.evaluation_service import evaluate_profile

router = APIRouter()


@router.get("/profiles", response_model=list[EvaluationProfile])
async def profiles() -> list[dict[str, object]]:
    return list_demo_profiles()


def resolve_profile_key(profile_id: str, db: Session) -> str:
    if profile_id.isdigit():
        profile = (
            db.query(EvaluationProfileModel)
            .filter(EvaluationProfileModel.id == int(profile_id))
            .first()
        )
        if profile is not None:
            return profile.name
    return profile_id


async def run_profile_evaluation(profile_key: str, db: Session) -> EvaluationResultModel:
    try:
        company = get_demo_profile(profile_key)
        metadata = get_demo_profile_metadata(profile_key)
    except KeyError:
        raise not_found("Evaluation profile not found") from None

    profile = (
        db.query(EvaluationProfileModel)
        .filter(EvaluationProfileModel.name == profile_key)
        .first()
    )
    if profile is None:
        profile = EvaluationProfileModel(
            name=profile_key,
            mode=metadata["mode"],
            profile_input=metadata["profile_input"],
            expected_confidence=metadata["expected_confidence"],
            thin_data_case=metadata["thin_data_case"],
        )
        db.add(profile)
        db.flush()

    result = await run_in_threadpool(
        evaluate_profile,
        profile_key,
        company,
        metadata["expected_confidence"],
    )
    row = EvaluationResultModel(evaluation_profile_id=profile.id, **result)
    db.add(row)
    db.commit()
    db.refresh(row)
    row.evaluation_profile = profile
    return row


@router.post("/run", response_model=EvaluationResult)
async def run_evaluation(
    payload: EvaluationRunRequest,
    db: Session = Depends(get_db),
) -> EvaluationResultModel:
    return await run_profile_evaluation(payload.profile_key, db)


@router.post("/run/{profile_id}", response_model=EvaluationResult)
async def run_evaluation_by_profile_id(
    profile_id: str,
    db: Session = Depends(get_db),
) -> EvaluationResultModel:
    return await run_profile_evaluation(resolve_profile_key(profile_id, db), db)


@router.post("/results/{result_id}/rate", response_model=EvaluationResult)
async def rate_evaluation_result(
    result_id: int,
    payload: EvaluationRateRequest,
    db: Session = Depends(get_db),
) -> EvaluationResultModel:
    result = (
        db.query(EvaluationResultModel)
        .options(joinedload(EvaluationResultModel.evaluation_profile))
        .filter(EvaluationResultModel.id == result_id)
        .first()
    )
    if result is None:
        raise not_found("Evaluation result not found")

    result.human_preference = payload.human_preference
    result.notes = payload.notes
    db.commit()
    db.refresh(result)
    return result


@router.get("/summary", response_model=EvaluationSummary)
async def evaluation_summary(db: Session = Depends(get_db)) -> EvaluationSummary:
    rows = db.query(EvaluationResultModel).all()
    total = len(rows)
    confidence_pass_rate = (
        round(sum(1 for row in rows if row.confidence_pass) / total, 4) if total else None
    )
    human_preferences = {"baseline": 0, "agent": 0, "tie": 0}
    for row in rows:
        if row.human_preference in human_preferences:
            human_preferences[row.human_preference] += 1

    return EvaluationSummary(
        total_results=total,
        confidence_pass_rate=confidence_pass_rate,
        human_preferences=human_preferences,
    )
