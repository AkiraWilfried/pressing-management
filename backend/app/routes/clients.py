from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.client import Client
from app.models.user import User
from app.schemas.client import ClientCreate, ClientUpdate, ClientOut
from app.utils.activity import record
from app.utils.auth import get_current_user
from app.utils.id import generate_id
from app.utils.permissions import require_perm
from app.utils.query import display_label, get_live

router = APIRouter(prefix="/clients", tags=["clients"])

DbDep = Annotated[Session, Depends(get_db)]
CanView = Annotated[User, Depends(require_perm("clients", "view"))]
CanCreate = Annotated[User, Depends(require_perm("clients", "create"))]
CanEdit = Annotated[User, Depends(require_perm("clients", "edit"))]
CanDelete = Annotated[User, Depends(require_perm("clients", "delete"))]


@router.get("", response_model=list[ClientOut])
def get_clients(db: DbDep, _: CanView):
    return (
        db.query(Client)
        .filter(Client.deleted_at.is_(None))
        .order_by(Client.created_at.desc())
        .all()
    )


@router.get("/{client_id}", response_model=ClientOut)
def get_client(client_id: str, db: DbDep, _: CanView):
    return get_live(db, Client, client_id)


@router.post("", response_model=ClientOut, status_code=status.HTTP_201_CREATED)
def create_client(body: ClientCreate, db: DbDep, _: CanCreate):
    client = Client(
        id=generate_id(),
        nom=body.nom,
        telephone=body.telephone,
        adresse=body.adresse,
        created_at=datetime.now(timezone.utc),
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


@router.put("/{client_id}", response_model=ClientOut)
def update_client(client_id: str, body: ClientUpdate, db: DbDep, _: CanEdit):
    client = get_live(db, Client, client_id)

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(client, field, value)

    db.commit()
    db.refresh(client)
    return client


@router.delete("/{client_id}", response_model=ClientOut)
def delete_client(client_id: str, db: DbDep, actor: CanDelete):
    """Soft delete : la ligne reste visible et restaurable par le superadmin."""
    client = get_live(db, Client, client_id)
    client.deleted_at = datetime.now(timezone.utc)
    client.deleted_by = actor.id

    record(
        db,
        module="clients",
        entity_id=client.id,
        entity_label=display_label(client),
        action="delete",
        actor=actor,
    )

    db.commit()
    db.refresh(client)
    return client
