from typing import Annotated

from fastapi import Depends, HTTPException, status

from app.models.user import User
from app.utils.auth import get_current_user

MODULES = ("clients", "commandes", "services", "paiements")
ACTIONS = ("view", "create", "edit", "delete")

SUPERADMIN = "superadmin"


def is_superadmin(user: User) -> bool:
    return user.role == SUPERADMIN


def has_perm(user: User, module: str, action: str = "view") -> bool:
    if is_superadmin(user):
        return True
    permissions = user.permissions or {}
    if module == "users":
        return bool(permissions.get("users"))
    return bool(permissions.get(module, {}).get(action))


def require_perm(module: str, action: str = "view"):
    """Fabrique de dépendance — à appeler à l'import des routes, jamais dans un handler :
    FastAPI cache les dépendances par identité de fonction, une closure fraîche par
    requête relancerait get_current_user à chaque appel."""

    def dependency(user: Annotated[User, Depends(get_current_user)]) -> User:
        if not has_perm(user, module, action):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Droits insuffisants : « {action} » sur {module}",
            )
        return user

    return dependency


def require_superadmin(user: Annotated[User, Depends(get_current_user)]) -> User:
    if not is_superadmin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Réservé au superadministrateur",
        )
    return user
