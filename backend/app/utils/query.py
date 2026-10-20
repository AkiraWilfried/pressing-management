from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Commande, Paiement, Service, User
from app.models.client import Client

LABELS = {
    "Client": "client",
    "Service": "service",
    "Commande": "commande",
    "Paiement": "paiement",
    "User": "utilisateur",
}

# Module → modèle, pour la corbeille et le journal
MODELS = {
    "clients": Client,
    "commandes": Commande,
    "services": Service,
    "paiements": Paiement,
    "users": User,
}


def type_label(obj) -> str:
    return LABELS.get(type(obj).__name__, type(obj).__name__)


def display_label(obj) -> str:
    """Étiquette courte et parlante pour le journal et la corbeille."""
    if isinstance(obj, (Client, Service, User)):
        return obj.nom
    if isinstance(obj, Commande):
        return f"Commande #{obj.id[:8]} · {round(obj.total):,} F".replace(",", " ")
    if isinstance(obj, Paiement):
        return f"Paiement #{obj.id[:8]} · {round(obj.montant):,} F".replace(",", " ")
    return type_label(obj).capitalize()


def get_live(db: Session, model, object_id: str):
    """db.get() ignore tout filtre : c'est par là que les lignes en corbeille fuiteraient."""
    obj = db.get(model, object_id)
    label = LABELS.get(model.__name__, model.__name__)

    if not obj:
        raise HTTPException(status_code=404, detail=f"{label.capitalize()} introuvable")
    if getattr(obj, "deleted_at", None) is not None:
        raise HTTPException(
            status_code=404,
            detail=f"Dans la corbeille : {display_label(obj)}",
        )
    return obj
