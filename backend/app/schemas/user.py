from typing import Literal

from pydantic import BaseModel, Field

Role = Literal["superadmin", "admin", "agent"]


class ModulePermissions(BaseModel):
    view: bool = False
    create: bool = False
    edit: bool = False
    delete: bool = False


class Permissions(BaseModel):
    clients: ModulePermissions = Field(default_factory=ModulePermissions)
    commandes: ModulePermissions = Field(default_factory=ModulePermissions)
    services: ModulePermissions = Field(default_factory=ModulePermissions)
    paiements: ModulePermissions = Field(default_factory=ModulePermissions)
    # Booleen simple : autoriser la page Utilisateurs sans lui donner les 4 modules
    users: bool = False

    def as_dict(self) -> dict:
        return self.model_dump()


# ── Auth ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Comptes ──────────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    email: str
    nom: str = Field(min_length=1)
    role: Role = "agent"


class UserCreate(UserBase):
    password: str = Field(min_length=6)
    permissions: Permissions = Field(default_factory=Permissions)


class UserUpdate(BaseModel):
    nom: str | None = None
    role: Role | None = None
    permissions: Permissions | None = None


class PasswordReset(BaseModel):
    password: str = Field(min_length=6)


class UserOut(BaseModel):
    id: str
    email: str
    nom: str
    role: Role
    permissions: Permissions

    model_config = {"from_attributes": True}
