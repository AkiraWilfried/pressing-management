from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.paiement import Paiement
from app.models.user import User
from app.schemas.paiement import PaiementCreate, PaiementOut
from app.utils.auth import get_current_user
from app.utils.id import generate_id

router = APIRouter(prefix="/paiements", tags=["paiements"])

DbDep = Annotated[Session, Depends(get_db)]
AuthDep = Annotated[User, Depends(get_current_user)]


@router.get("", response_model=list[PaiementOut])
def get_paiements(db: DbDep, _: AuthDep):
    return db.query(Paiement).order_by(Paiement.date.desc()).all()


@router.post("", response_model=PaiementOut, status_code=status.HTTP_201_CREATED)
def create_paiement(body: PaiementCreate, db: DbDep, _: AuthDep):
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


@router.delete("/{paiement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_paiement(paiement_id: str, db: DbDep, _: AuthDep):
    paiement = db.get(Paiement, paiement_id)
    if not paiement:
        raise HTTPException(status_code=404, detail="Paiement introuvable")
    db.delete(paiement)
    db.commit()
