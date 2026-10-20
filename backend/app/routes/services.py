from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.service import Service
from app.models.user import User
from app.schemas.service import ServiceCreate, ServiceUpdate, ServiceOut
from app.utils.activity import record
from app.utils.auth import get_current_user
from app.utils.id import generate_id
from app.utils.permissions import require_perm
from app.utils.query import display_label, get_live

router = APIRouter(prefix="/services", tags=["services"])

DbDep = Annotated[Session, Depends(get_db)]
CanView = Annotated[User, Depends(require_perm("services", "view"))]
CanCreate = Annotated[User, Depends(require_perm("services", "create"))]
CanEdit = Annotated[User, Depends(require_perm("services", "edit"))]
CanDelete = Annotated[User, Depends(require_perm("services", "delete"))]


@router.get("", response_model=list[ServiceOut])
def get_services(db: DbDep, _: CanView):
    return db.query(Service).filter(Service.deleted_at.is_(None)).order_by(Service.nom).all()


@router.post("", response_model=ServiceOut, status_code=status.HTTP_201_CREATED)
def create_service(body: ServiceCreate, db: DbDep, _: CanCreate):
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
def update_service(service_id: str, body: ServiceUpdate, db: DbDep, _: CanEdit):
    service = get_live(db, Service, service_id)

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(service, field, value)

    db.commit()
    db.refresh(service)
    return service


@router.delete("/{service_id}", response_model=ServiceOut)
def delete_service(service_id: str, db: DbDep, actor: CanDelete):
    service = get_live(db, Service, service_id)
    service.deleted_at = datetime.now(timezone.utc)
    service.deleted_by = actor.id

    record(
        db,
        module="services",
        entity_id=service.id,
        entity_label=display_label(service),
        action="delete",
        actor=actor,
    )

    db.commit()
    db.refresh(service)
    return service
