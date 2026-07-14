from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.core.errors import not_found
from app.db.session import get_db
from app.models.company import Company
from app.models.feedback import Feedback
from app.models.icp_run import ICPRun
from app.models.user import User
from app.schemas.feedback import FeedbackCreate, FeedbackRead

router = APIRouter()


@router.post("", response_model=FeedbackRead)
def create_feedback(
    payload: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Feedback:
    run = (
        db.query(ICPRun)
        .join(Company)
        .filter(ICPRun.id == payload.run_id, ICPRun.user_id == current_user.id)
        .first()
    )
    if run is None:
        raise not_found("Analysis run not found")

    feedback = Feedback(**payload.model_dump())
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


@router.get("/{run_id}", response_model=list[FeedbackRead])
def list_feedback(
    run_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Feedback]:
    run = (
        db.query(ICPRun)
        .join(Company)
        .filter(ICPRun.id == run_id, ICPRun.user_id == current_user.id)
        .first()
    )
    if run is None:
        raise not_found("Analysis run not found")
    return db.query(Feedback).filter(Feedback.run_id == run_id).order_by(Feedback.created_at.desc()).all()
