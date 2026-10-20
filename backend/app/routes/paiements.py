from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.client import Client
from app.models.commande import Commande
from app.models.paiement import Paiement
from app.models.user import User
from app.schemas.paiement import PaiementCreate, PaiementOut
from app.utils.activity import record
from app.utils.auth import get_current_user
from app.utils.id import generate_id
from app.utils.permissions import require_perm
from app.utils.query import display_label, get_live

router = APIRouter(prefix="/paiements", tags=["paiements"])

DbDep = Annotated[Session, Depends(get_db)]
CanView = Annotated[User, Depends(require_perm("paiements", "view"))]
CanCreate = Annotated[User, Depends(require_perm("paiements", "create"))]
CanDelete = Annotated[User, Depends(require_perm("paiements", "delete"))]


@router.get("", response_model=list[PaiementOut])
def get_paiements(db: DbDep, _: CanView):
    # Un paiement n'est visible que si toute sa chaîne (commande, client) l'est
    return (
        db.query(Paiement)
        .join(Commande, Commande.id == Paiement.commande_id)
        .join(Client, Client.id == Commande.client_id)
        .filter(
            Paiement.deleted_at.is_(None),
            Commande.deleted_at.is_(None),
            Client.deleted_at.is_(None),
        )
        .order_by(Paiement.date.desc())
        .all()
    )


@router.post("", response_model=PaiementOut, status_code=status.HTTP_201_CREATED)
def create_paiement(body: PaiementCreate, db: DbDep, _: CanCreate):
    get_live(db, Commande, body.commande_id)
    paiement = Paiement(
        id=generate_id(),
        commande_id=body.commande_id,
        montant=body.montant,
        date=body.date or datetime.now(timezone.utc),
        mode_paiement=body.mode_paiement,
    )
    db.add(paiement)
    db.commit()
    db.refresh(paiement)
    return paiement


@router.delete("/{paiement_id}", response_model=PaiementOut)
def delete_paiement(paiement_id: str, db: DbDep, actor: CanDelete):
    paiement = get_live(db, Paiement, paiement_id)
    paiement.deleted_at = datetime.now(timezone.utc)
    paiement.deleted_by = actor.id

    record(
        db,
        module="paiements",
        entity_id=paiement.id,
        entity_label=display_label(paiement),
        action="delete",
        actor=actor,
    )

    db.commit()
    db.refresh(paiement)
    return paiement
