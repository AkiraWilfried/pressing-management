from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.service import Service
from app.models.user import User
from app.schemas.service import ServiceCreate, ServiceUpdate, ServiceOut
from app.utils.auth import get_current_user
from app.utils.id import generate_id

router = APIRouter(prefix="/services", tags=["services"])

DbDep = Annotated[Session, Depends(get_db)]
AuthDep = Annotated[User, Depends(get_current_user)]


@router.get("", response_model=list[ServiceOut])
def get_services(db: DbDep, _: AuthDep):
    return db.query(Service).order_by(Service.nom).all()


@router.post("", response_model=ServiceOut, status_code=status.HTTP_201_CREATED)
def create_service(body: ServiceCreate, db: DbDep, _: AuthDep):
    service = Service(
        id=generate_id(),
        nom=body.nom,
        prix=body.prix,
        delai=body.delai,
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.put("/{service_id}", response_model=ServiceOut)
def update_service(service_id: str, body: ServiceUpdate, db: DbDep, _: AuthDep):
    service = db.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service introuvable")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(service, field, value)

    db.commit()
    db.refresh(service)
    return service


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(service_id: str, db: DbDep, _: AuthDep):
    service = db.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service introuvable")
    db.delete(service)
    db.commit()
