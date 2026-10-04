from typing import Literal
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: str
    nom: str
    role: Literal["admin", "user"] = "user"


class UserCreate(UserBase):
    password: str


class UserOut(UserBase):
    id: str

    model_config = {"from_attributes": True}


# ── Auth ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
