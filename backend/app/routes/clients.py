from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.client import Client
from app.models.user import User
from app.schemas.client import ClientCreate, ClientUpdate, ClientOut
from app.utils.auth import get_current_user
from app.utils.id import generate_id

router = APIRouter(prefix="/clients", tags=["clients"])

DbDep = Annotated[Session, Depends(get_db)]
AuthDep = Annotated[User, Depends(get_current_user)]


@router.get("", response_model=list[ClientOut])
def get_clients(db: DbDep, _: AuthDep):
    return db.query(Client).order_by(Client.created_at.desc()).all()


@router.get("/{client_id}", response_model=ClientOut)
def get_client(client_id: str, db: DbDep, _: AuthDep):
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client introuvable")
    return client


@router.post("", response_model=ClientOut, status_code=status.HTTP_201_CREATED)
def create_client(body: ClientCreate, db: DbDep, _: AuthDep):
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
def update_client(client_id: str, body: ClientUpdate, db: DbDep, _: AuthDep):
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client introuvable")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(client, field, value)

    db.commit()
    db.refresh(client)
    return client


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(client_id: str, db: DbDep, _: AuthDep):
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client introuvable")
    db.delete(client)
    db.commit()
