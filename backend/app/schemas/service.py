from pydantic import BaseModel


class ServiceBase(BaseModel):
    nom: str
    prix: float
    delai: int = 24  # heures


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    nom: str | None = None
    prix: float | None = None
    delai: int | None = None


class ServiceOut(ServiceBase):
    id: str

    model_config = {"from_attributes": True}
