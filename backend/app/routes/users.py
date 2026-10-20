from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import PasswordReset, UserCreate, UserOut, UserUpdate
from app.utils.auth import get_current_user, hash_password
from app.utils.id import generate_id
from app.utils.permissions import is_superadmin, require_perm
from app.utils.query import get_live

router = APIRouter(prefix="/users", tags=["users"])

DbDep = Annotated[Session, Depends(get_db)]
CanManage = Annotated[User, Depends(require_perm("users", "manage"))]


def _guard_privilege_escalation(actor: User, role: str | None, users_perm: bool | None) -> None:
    """Un compte « gestionnaire » ne doit pas pouvoir se fabriquer un égal."""
    if is_superadmin(actor):
        return
    if role == "superadmin" or users_perm:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul le superadministrateur peut accorder ces droits",
        )


def _count_superadmins(db: Session) -> int:
    return (
        db.query(User)
        .filter(User.role == "superadmin", User.deleted_at.is_(None))
        .count()
    )


@router.get("", response_model=list[UserOut])
def get_users(db: DbDep, _: CanManage):
    return (
        db.query(User)
        .filter(User.deleted_at.is_(None))
        .order_by(User.nom)
        .all()
    )


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: str, db: DbDep, _: CanManage):
    return get_live(db, User, user_id)


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(body: UserCreate, db: DbDep, actor: CanManage):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un utilisateur avec cet email existe déjà",
        )

    _guard_privilege_escalation(actor, body.role, body.permissions.users)

    user = User(
        id=generate_id(),
        nom=body.nom,
        email=body.email,
        hashed_password=hash_password(body.password),
        role=body.role,
        permissions=body.permissions.as_dict(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: str, body: UserUpdate, db: DbDep, actor: CanManage):
    user = get_live(db, User, user_id)

    if body.role is not None and user.role == "superadmin" and body.role != "superadmin":
        if _count_superadmins(db) <= 1:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Au moins un superadministrateur doit rester actif",
            )

    permissions = body.permissions.as_dict() if body.permissions is not None else None
    _guard_privilege_escalation(actor, body.role, permissions.get("users") if permissions else None)

    if body.nom is not None:
        user.nom = body.nom
    if body.role is not None:
        user.role = body.role
    if permissions is not None:
        user.permissions = permissions

    db.commit()
    db.refresh(user)
    return user


@router.post("/{user_id}/password", response_model=UserOut)
def reset_password(user_id: str, body: PasswordReset, db: DbDep, _: CanManage):
    user = get_live(db, User, user_id)
    user.hashed_password = hash_password(body.password)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", response_model=UserOut)
def delete_user(user_id: str, db: DbDep, actor: CanManage):
    user = get_live(db, User, user_id)

    if user.id == actor.id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vous ne pouvez pas supprimer votre propre compte",
        )
    if user.role == "superadmin" and _count_superadmins(db) <= 1:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Au moins un superadministrateur doit rester actif",
        )

    user.deleted_at = datetime.now(timezone.utc)
    user.deleted_by = actor.id

    db.commit()
    db.refresh(user)
    return user
