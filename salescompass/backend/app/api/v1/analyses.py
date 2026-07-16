from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import ValidationError
from sqlalchemy.orm import Session, joinedload
from starlette.concurrency import run_in_threadpool

from app.api.v1.auth import get_current_user
from app.core.errors import not_found
from app.db.session import get_db
from app.models.company import Company
from app.models.feedback import Feedback
from app.models.icp_run import ICPRun
from app.models.user import User
from app.schemas.analysis import (
    ActionPlanResponse,
    AnalysisCreate,
    AnalysisRefineRequest,
    ICPRunRead,
)
from app.schemas.company import COMPANY_MODEL_FIELDS, CompanyCreate
from app.schemas.feedback import FeedbackRead
from app.services.analysis_pipeline import (
    AgentOutputValidationError,
    generate_action_plan as generate_ai_action_plan,
    generate_baseline,
    refine_analysis as refine_ai_analysis,
    run_full_analysis,
)

router = APIRouter()


def get_owned_run(db: Session, run_id: int, user_id: int) -> ICPRun:
    run = (
        db.query(ICPRun)
        .options(joinedload(ICPRun.company))
        .filter(ICPRun.id == run_id, ICPRun.user_id == user_id)
        .first()
    )
    if run is None:
        raise not_found("Analysis run not found")
    return run


def get_owned_company(db: Session, company_id: int, user_id: int) -> Company:
    company = (
        db.query(Company)
        .filter(Company.id == company_id, Company.user_id == user_id)
        .first()
    )
    if company is None:
        raise not_found("Company not found")
    return company


def company_to_input(company: Company) -> dict[str, object]:
    return {
        field: value
        for field in COMPANY_MODEL_FIELDS
        if (value := getattr(company, field, None)) is not None
    }


def validate_company_input(data: dict[str, object]) -> CompanyCreate:
    try:
        return CompanyCreate.model_validate(data)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


def build_company_input(payload: AnalysisCreate, existing_company: Company | None) -> CompanyCreate:
    if payload.company is not None:
        return payload.company

    data: dict[str, object] = {}
    if existing_company is not None:
        data.update(company_to_input(existing_company))
    if payload.input is not None:
        data.update(payload.input)
    if payload.mode is not None:
        data["mode"] = payload.mode

    return validate_company_input(data)


@router.post("", response_model=ICPRunRead)
async def create_analysis(
    payload: AnalysisCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ICPRun:
    existing_company = (
        get_owned_company(db, payload.company_id, current_user.id)
        if payload.company_id is not None
        else None
    )
    company_input = build_company_input(payload, existing_company)
    input_snapshot = company_input.model_dump(mode="json")

    if existing_company is None:
        company = Company(user_id=current_user.id, **company_input.to_model_dict())
        db.add(company)
        db.flush()
    else:
        company = existing_company

    run = ICPRun(
        user_id=current_user.id,
        company_id=company.id,
        status="pending",
        mode=company_input.mode,
        input_snapshot=input_snapshot,
        agent_output={},
        baseline_output={},
    )
    db.add(run)
    db.flush()

    try:
        analysis = await run_in_threadpool(run_full_analysis, input_snapshot, company_input.mode)
    except AgentOutputValidationError as exc:
        run.status = "failed"
        run.error_message = str(exc)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Analysis output failed validation",
        ) from exc
    except Exception as exc:
        run.status = "failed"
        run.error_message = str(exc)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Analysis failed",
        ) from exc

    result_data = analysis["agent_output"]
    run.status = "completed"
    run.agent_output = result_data
    run.baseline_output = analysis["baseline_output"]
    run.action_plan = result_data.get("approach")

    db.commit()
    db.refresh(run)
    run.company = company
    return run


@router.get("", response_model=list[ICPRunRead])
async def list_analyses(
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
async def get_analysis(
    run_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ICPRun:
    return get_owned_run(db, run_id, current_user.id)


@router.get("/{run_id}/feedback", response_model=list[FeedbackRead])
async def list_analysis_feedback(
    run_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Feedback]:
    get_owned_run(db, run_id, current_user.id)
    return (
        db.query(Feedback)
        .filter(Feedback.run_id == run_id)
        .order_by(Feedback.created_at.desc())
        .all()
    )


@router.post("/{run_id}/approve", response_model=ICPRunRead)
async def approve_analysis(
    run_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ICPRun:
    run = get_owned_run(db, run_id, current_user.id)
    run.review_status = "approved"
    run.error_message = None
    db.commit()
    db.refresh(run)
    return run


@router.post("/{run_id}/refine", response_model=ICPRunRead)
async def refine_analysis(
    run_id: int,
    payload: AnalysisRefineRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ICPRun:
    run = get_owned_run(db, run_id, current_user.id)
    data = dict(run.input_snapshot)
    if payload.input:
        data.update(payload.input)

    company_input = validate_company_input(data)
    company_payload = company_input.model_dump(mode="json")
    try:
        result_data = await run_in_threadpool(
            refine_ai_analysis,
            company_payload,
            run.agent_output,
            payload.notes,
        )
        baseline = await run_in_threadpool(generate_baseline, company_payload, company_input.mode)
    except AgentOutputValidationError as exc:
        run.error_message = str(exc)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Analysis output failed validation",
        ) from exc
    except Exception as exc:
        run.error_message = str(exc)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Refinement failed. Your current recommendation is unchanged.",
        ) from exc

    run.status = "completed"
    run.mode = company_input.mode
    run.input_snapshot = company_input.model_dump(mode="json")
    run.agent_output = result_data
    run.baseline_output = baseline
    run.action_plan = result_data.get("approach")
    run.review_status = "needs_review"
    run.refinement_notes = payload.notes
    run.error_message = None

    db.commit()
    db.refresh(run)
    return run


@router.post("/{run_id}/action-plan", response_model=ActionPlanResponse)
async def create_action_plan(
    run_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ActionPlanResponse:
    run = get_owned_run(db, run_id, current_user.id)
    try:
        action_plan = await run_in_threadpool(
            generate_ai_action_plan,
            run.input_snapshot,
            run.agent_output,
        )
    except Exception as exc:
        run.error_message = str(exc)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Action plan failed. Your approved recommendation is unchanged.",
        ) from exc

    run.action_plan = action_plan
    run.error_message = None
    db.commit()
    return ActionPlanResponse(run_id=run.id, action_plan=action_plan)
