from datetime import datetime
from pydantic import BaseModel


class ClientBase(BaseModel):
    nom: str
    telephone: str
    adresse: str = ""


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    nom: str | None = None
    telephone: str | None = None
    adresse: str | None = None


class ClientOut(ClientBase):
    id: str
    created_at: datetime

    model_config = {"from_attributes": True}
