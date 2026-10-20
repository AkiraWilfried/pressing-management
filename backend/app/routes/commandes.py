from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.client import Client
from app.models.commande import Commande, CommandeItem
from app.models.user import User
from app.schemas.commande import CommandeCreate, CommandeUpdate, CommandeOut
from app.utils.activity import record
from app.utils.auth import get_current_user
from app.utils.id import generate_id
from app.utils.permissions import require_perm
from app.utils.query import display_label, get_live

router = APIRouter(prefix="/commandes", tags=["commandes"])

DbDep = Annotated[Session, Depends(get_db)]
CanView = Annotated[User, Depends(require_perm("commandes", "view"))]
CanCreate = Annotated[User, Depends(require_perm("commandes", "create"))]
CanEdit = Annotated[User, Depends(require_perm("commandes", "edit"))]
CanDelete = Annotated[User, Depends(require_perm("commandes", "delete"))]


def _load_commande(db: Session, commande_id: str, *, include_deleted: bool = False) -> Commande:
    """Charge une commande avec ses items (eager load), hors corbeille par défaut."""
    query = (
        db.query(Commande)
        .options(selectinload(Commande.items))
        .filter(Commande.id == commande_id)
    )
    if not include_deleted:
        query = query.join(Client, Client.id == Commande.client_id).filter(
            Commande.deleted_at.is_(None), Client.deleted_at.is_(None)
        )

    commande = query.first()
    if not commande:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    return commande


@router.get("", response_model=list[CommandeOut])
def get_commandes(
    db: DbDep,
    _: CanView,
    client_id: str | None = Query(default=None),
):
    # Une commande suit son client : tant que le client est en corbeille, elle reste
    # hors des listes pour tout le monde — et y revient quand il est restauré.
    query = (
        db.query(Commande)
        .options(selectinload(Commande.items))
        .join(Client, Client.id == Commande.client_id)
        .filter(Commande.deleted_at.is_(None), Client.deleted_at.is_(None))
    )
    if client_id:
        query = query.filter(Commande.client_id == client_id)
    return query.order_by(Commande.date_depot.desc()).all()


@router.get("/{commande_id}", response_model=CommandeOut)
def get_commande(commande_id: str, db: DbDep, _: CanView):
    return _load_commande(db, commande_id)


@router.post("", response_model=CommandeOut, status_code=status.HTTP_201_CREATED)
def create_commande(body: CommandeCreate, db: DbDep, _: CanCreate):
    get_live(db, Client, body.client_id)  # un panier vers un client en corbeille est un 404
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
def update_commande(commande_id: str, body: CommandeUpdate, db: DbDep, _: CanEdit):
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


@router.delete("/{commande_id}", response_model=CommandeOut)
def delete_commande(commande_id: str, db: DbDep, actor: CanDelete):
    """Les items suivent le drapeau du parent — ils n'ont pas de soft-delete propre."""
    commande = _load_commande(db, commande_id)
    commande.deleted_at = datetime.now(timezone.utc)
    commande.deleted_by = actor.id

    record(
        db,
        module="commandes",
        entity_id=commande.id,
        entity_label=display_label(commande),
        action="delete",
        actor=actor,
    )

    db.commit()
    return _load_commande(db, commande_id, include_deleted=True)
