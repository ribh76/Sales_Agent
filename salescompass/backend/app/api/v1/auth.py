from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.errors import conflict, unauthorized
from app.core.security import create_access_token, decode_access_token, get_password_hash, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, Token
from app.schemas.user import UserRead

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def parse_login_request(request: Request) -> LoginRequest:
    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        data = await request.json()
    else:
        form = await request.form()
        data = {
            "email": form.get("email") or form.get("username"),
            "password": form.get("password"),
        }

    try:
        return LoginRequest.model_validate(data)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=exc.errors(),
        ) from exc


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    subject = decode_access_token(token)
    if subject is None:
        raise unauthorized()

    user = db.query(User).filter(User.email == subject).first()
    if user is None:
        raise unauthorized()
    return user


@router.post("/register", response_model=UserRead)
async def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> User:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise conflict("A user with this email already exists")

    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        raise conflict("A user with this username already exists")

    user = User(
        email=str(payload.email),
        username=payload.username,
        hashed_password=get_password_hash(payload.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        if db.query(User).filter(User.email == payload.email).first():
            raise conflict("A user with this email already exists") from exc
        if db.query(User).filter(User.username == payload.username).first():
            raise conflict("A user with this username already exists") from exc
        raise conflict("A user with these credentials already exists") from exc
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
async def login(
    payload: LoginRequest = Depends(parse_login_request),
    db: Session = Depends(get_db),
) -> Token:
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise unauthorized("Incorrect email or password")
    return Token(access_token=create_access_token(user.email), user=UserRead.model_validate(user))


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
