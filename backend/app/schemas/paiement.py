from datetime import datetime
from typing import Literal
from pydantic import BaseModel

ModePaiement = Literal["Cash", "Mobile Money", "Orange Money"]


class PaiementBase(BaseModel):
    commande_id: str
    montant: float
    mode_paiement: ModePaiement = "Cash"


class PaiementCreate(PaiementBase):
    date: datetime | None = None


class PaiementOut(PaiementBase):
    id: str
    date: datetime

    model_config = {"from_attributes": True}
