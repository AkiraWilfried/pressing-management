from datetime import datetime
from typing import Literal
from pydantic import BaseModel

StatutCommande = Literal["En cours", "Lavé", "Repassé", "Prêt", "Retiré", "En retard"]


# ── CommandeItem ──────────────────────────────────────────────────────────────

class CommandeItemBase(BaseModel):
    nom: str
    service: str
    quantite: int = 1
    prix: float = 0.0
    references: list[str] = []


class CommandeItemCreate(CommandeItemBase):
    pass


class CommandeItemOut(CommandeItemBase):
    id: str
    commande_id: str

    model_config = {"from_attributes": True}


# ── Commande ──────────────────────────────────────────────────────────────────

class CommandeBase(BaseModel):
    client_id: str
    date_depot: datetime
    date_retrait: datetime
    statut: StatutCommande = "En cours"
    total: float = 0.0


class CommandeCreate(CommandeBase):
    items: list[CommandeItemCreate] = []


class CommandeUpdate(BaseModel):
    client_id: str | None = None
    date_depot: datetime | None = None
    date_retrait: datetime | None = None
    statut: StatutCommande | None = None
    total: float | None = None
    items: list[CommandeItemCreate] | None = None


class CommandeOut(CommandeBase):
    id: str
    items: list[CommandeItemOut] = []

    model_config = {"from_attributes": True}
