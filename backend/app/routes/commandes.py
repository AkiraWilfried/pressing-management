from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.commande import Commande, CommandeItem
from app.models.user import User
from app.schemas.commande import CommandeCreate, CommandeUpdate, CommandeOut
from app.utils.auth import get_current_user
from app.utils.id import generate_id

router = APIRouter(prefix="/commandes", tags=["commandes"])

DbDep = Annotated[Session, Depends(get_db)]
AuthDep = Annotated[User, Depends(get_current_user)]


def _load_commande(db: Session, commande_id: str) -> Commande:
    """Charge une commande avec ses items (eager load)."""
    commande = (
        db.query(Commande)
        .options(selectinload(Commande.items))
        .filter(Commande.id == commande_id)
        .first()
    )
    if not commande:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    return commande


@router.get("", response_model=list[CommandeOut])
def get_commandes(
    db: DbDep,
    _: AuthDep,
    client_id: str | None = Query(default=None),
):
    query = db.query(Commande).options(selectinload(Commande.items))
    if client_id:
        query = query.filter(Commande.client_id == client_id)
    return query.order_by(Commande.date_depot.desc()).all()


@router.get("/{commande_id}", response_model=CommandeOut)
def get_commande(commande_id: str, db: DbDep, _: AuthDep):
    return _load_commande(db, commande_id)


@router.post("", response_model=CommandeOut, status_code=status.HTTP_201_CREATED)
def create_commande(body: CommandeCreate, db: DbDep, _: AuthDep):
    commande_id = generate_id()

    # Calcul du total depuis les items
    total = sum(item.prix * item.quantite for item in body.items)

    commande = Commande(
        id=commande_id,
        client_id=body.client_id,
        date_depot=body.date_depot,
        date_retrait=body.date_retrait,
        statut=body.statut,
        total=total if total > 0 else body.total,
    )
    db.add(commande)

    for item_data in body.items:
        item = CommandeItem(
            id=generate_id(),
            commande_id=commande_id,
            nom=item_data.nom,
            service=item_data.service,
            quantite=item_data.quantite,
            prix=item_data.prix,
            references=item_data.references,
        )
        db.add(item)

    db.commit()
    return _load_commande(db, commande_id)


@router.put("/{commande_id}", response_model=CommandeOut)
def update_commande(commande_id: str, body: CommandeUpdate, db: DbDep, _: AuthDep):
    commande = _load_commande(db, commande_id)

    # Mise à jour des champs scalaires
    scalar_fields = ["client_id", "date_depot", "date_retrait", "statut", "total"]
    for field in scalar_fields:
        value = getattr(body, field)
        if value is not None:
            setattr(commande, field, value)

    # Mise à jour des items si fournis
    if body.items is not None:
        # Supprimer les anciens items
        db.query(CommandeItem).filter(CommandeItem.commande_id == commande_id).delete()

        # Recréer les nouveaux
        total = 0.0
        for item_data in body.items:
            item = CommandeItem(
                id=generate_id(),
                commande_id=commande_id,
                nom=item_data.nom,
                service=item_data.service,
                quantite=item_data.quantite,
                prix=item_data.prix,
                references=item_data.references,
            )
            db.add(item)
            total += item_data.prix * item_data.quantite

        # Recalculer le total seulement si non fourni explicitement
        if body.total is None:
            commande.total = total

    db.commit()
    return _load_commande(db, commande_id)


@router.delete("/{commande_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_commande(commande_id: str, db: DbDep, _: AuthDep):
    commande = db.get(Commande, commande_id)
    if not commande:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    db.delete(commande)
    db.commit()
