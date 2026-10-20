from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.client import Client
from app.models.commande import Commande
from app.models.user import User
from app.schemas.trash import TrashAction, TrashItem
from app.utils.activity import record
from app.utils.permissions import require_superadmin
from app.utils.query import MODELS, display_label

router = APIRouter(prefix="/trash", tags=["trash"])

DbDep = Annotated[Session, Depends(get_db)]
SuperAdmin = Annotated[User, Depends(require_superadmin)]

TRASH_MODULES = ("clients", "commandes", "services", "paiements", "users")


def _restore_blocker(db: Session, module: str, obj) -> str | None:
    """Parent encore en corbeille, sous son libellé — la ligne resterait invisible une
    fois restaurée, ce qui ressemblerait à une restauration ratée."""
    if module == "commandes":
        parents = [db.get(Client, obj.client_id)]
    elif module == "paiements":
        commande = db.get(Commande, obj.commande_id)
        parents = [commande, db.get(Client, commande.client_id) if commande else None]
    else:
        parents = []

    for parent in parents:
        if parent is not None and parent.deleted_at is not None:
            return display_label(parent)
    return None


def _load_trashed(db: Session, module: str, object_id: str):
    if module not in TRASH_MODULES:
        raise HTTPException(status_code=404, detail=f"Module inconnu : {module}")

    model = MODELS[module]
    obj = db.get(model, object_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Élément introuvable")
    if obj.deleted_at is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cet élément n'est pas dans la corbeille",
        )
    return obj


@router.get("", response_model=list[TrashItem])
def get_trash(
    db: DbDep,
    _: SuperAdmin,
    module: str | None = Query(default=None),
):
    if module is not None and module not in TRASH_MODULES:
        raise HTTPException(status_code=404, detail=f"Module inconnu : {module}")

    modules = (module,) if module else TRASH_MODULES

    rows = []
    for name in modules:
        model = MODELS[name]
        for obj in db.query(model).filter(model.deleted_at.isnot(None)).all():
            rows.append((name, obj))

    actor_ids = {obj.deleted_by for _, obj in rows if obj.deleted_by}
    noms = (
        {user.id: user.nom for user in db.query(User).filter(User.id.in_(actor_ids)).all()}
        if actor_ids
        else {}
    )

    items = [
        TrashItem(
            module=name,
            id=obj.id,
            label=display_label(obj),
            deleted_at=obj.deleted_at,
            deleted_by=obj.deleted_by,
            deleted_by_nom=noms.get(obj.deleted_by, "compte supprimé") if obj.deleted_by else "inconnu",
            restorable=_restore_blocker(db, name, obj) is None,
        )
        for name, obj in rows
    ]
    items.sort(key=lambda item: item.deleted_at, reverse=True)
    return items


@router.post("/{module}/{object_id}/restore", response_model=TrashAction)
def restore(module: str, object_id: str, db: DbDep, actor: SuperAdmin):
    obj = _load_trashed(db, module, object_id)

    blocker = _restore_blocker(db, module, obj)
    if blocker is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Restauration impossible : « {blocker} » est encore dans la corbeille",
        )

    label = display_label(obj)
    obj.deleted_at = None
    obj.deleted_by = None
    record(db, module=module, entity_id=obj.id, entity_label=label, action="restore", actor=actor)

    db.commit()
    return TrashAction(module=module, id=obj.id, label=label, action="restore")


@router.delete("/{module}/{object_id}", status_code=status.HTTP_204_NO_CONTENT)
def purge(module: str, object_id: str, db: DbDep, actor: SuperAdmin):
    """Destruction définitive — irrévocable, d'où la notification conservée."""
    obj = _load_trashed(db, module, object_id)
    label = display_label(obj)

    # La notification survit à la ligne qu'elle raconte (actor_id passe à NULL, pas la ligne)
    record(db, module=module, entity_id=obj.id, entity_label=label, action="purge", actor=actor)
    db.delete(obj)

    db.commit()
