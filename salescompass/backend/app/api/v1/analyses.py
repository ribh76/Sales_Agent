from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.api.v1.auth import get_current_user
from app.core.errors import not_found
from app.db.session import get_db
from app.models.company import Company
from app.models.icp_run import ICPRun
from app.models.user import User
from app.schemas.analysis import AnalysisCreate, ICPRunRead
from app.services.baseline_service import build_baseline
from app.services.analysis_cache import run_cached_icp_analysis

router = APIRouter()


@router.post("", response_model=ICPRunRead)
def create_analysis(
    payload: AnalysisCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ICPRun:
    company_data = payload.company.to_model_dict()
    input_snapshot = payload.company.model_dump(mode="json")
    company = Company(user_id=current_user.id, **company_data)
    db.add(company)
    db.flush()

    result = run_cached_icp_analysis(payload.company)
    result_data = result.model_dump(mode="json")
    baseline = build_baseline(payload.company)
    run = ICPRun(
        user_id=current_user.id,
        company_id=company.id,
        status="completed",
        mode=payload.company.mode,
        input_snapshot=input_snapshot,
        agent_output=result_data,
        baseline_output=baseline,
        action_plan=result_data.get("action_plan"),
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    run.company = company
    return run


@router.get("", response_model=list[ICPRunRead])
def list_analyses(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[ICPRun]:
    return (
        db.query(ICPRun)
        .join(Company)
        .options(joinedload(ICPRun.company))
        .filter(ICPRun.user_id == current_user.id)
        .order_by(ICPRun.created_at.desc())
        .all()
    )


@router.get("/{run_id}", response_model=ICPRunRead)
def get_analysis(
    run_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ICPRun:
    run = (
        db.query(ICPRun)
        .join(Company)
        .options(joinedload(ICPRun.company))
        .filter(ICPRun.id == run_id, ICPRun.user_id == current_user.id)
        .first()
    )
    if run is None:
        raise not_found("Analysis run not found")
    return run
