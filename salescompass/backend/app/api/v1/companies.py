from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload

from app.api.v1.auth import get_current_user
from app.core.errors import not_found
from app.db.session import get_db
from app.models.company import Company
from app.models.icp_run import ICPRun
from app.models.user import User
from app.schemas.analysis import ICPRunRead
from app.schemas.company import CompanyCreate, CompanyRead, CompanyUpdate

router = APIRouter()


def get_owned_company(db: Session, company_id: int, user_id: int) -> Company:
    company = (
        db.query(Company)
        .filter(Company.id == company_id, Company.user_id == user_id)
        .first()
    )
    if company is None:
        raise not_found("Company not found")
    return company


@router.post("", response_model=CompanyRead)
async def create_company(
    payload: CompanyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Company:
    company = Company(user_id=current_user.id, **payload.to_model_dict())
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@router.get("", response_model=list[CompanyRead])
async def list_companies(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[Company]:
    return (
        db.query(Company)
        .filter(Company.user_id == current_user.id)
        .order_by(Company.created_at.desc())
        .all()
    )


@router.get("/{company_id}", response_model=CompanyRead)
async def get_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Company:
    return get_owned_company(db, company_id, current_user.id)


@router.put("/{company_id}", response_model=CompanyRead)
async def update_company(
    company_id: int,
    payload: CompanyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Company:
    company = get_owned_company(db, company_id, current_user.id)

    for key, value in payload.to_model_dict().items():
        setattr(company, key, value)

    db.commit()
    db.refresh(company)
    return company


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    company = get_owned_company(db, company_id, current_user.id)
    db.delete(company)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{company_id}/analyses", response_model=list[ICPRunRead])
async def list_company_analyses(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ICPRun]:
    get_owned_company(db, company_id, current_user.id)
    return (
        db.query(ICPRun)
        .options(joinedload(ICPRun.company))
        .filter(ICPRun.company_id == company_id, ICPRun.user_id == current_user.id)
        .order_by(ICPRun.created_at.desc())
        .all()
    )
