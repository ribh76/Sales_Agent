from pydantic import AliasChoices, BaseModel, EmailStr, Field

from app.schemas.user import UserRead


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(
        validation_alias=AliasChoices("username", "full_name"),
        min_length=2,
        max_length=255,
    )
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead | None = None
