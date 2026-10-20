from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationOut, UnreadCount
from app.utils.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])

DbDep = Annotated[Session, Depends(get_db)]
AuthDep = Annotated[User, Depends(get_current_user)]


def _visible(db: Session, me: User):
    """user_id NULL = journal des suppressions, réservé aux superadmins."""
    query = db.query(Notification)
    if me.role == "superadmin":
        return query.filter(or_(Notification.user_id.is_(None), Notification.user_id == me.id))
    return query.filter(Notification.user_id == me.id)


@router.get("", response_model=list[NotificationOut])
def get_notifications(
    db: DbDep,
    me: AuthDep,
    unread_only: bool = Query(default=False),
):
    query = _visible(db, me)
    if unread_only:
        query = query.filter(Notification.read_at.is_(None))
    return query.order_by(Notification.created_at.desc()).all()


@router.get("/unread-count", response_model=UnreadCount)
def unread_count(db: DbDep, me: AuthDep):
    count = (
        _visible(db, me)
        .filter(Notification.read_at.is_(None))
        .count()
    )
    return UnreadCount(count=count)


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_read(db: DbDep, me: AuthDep):
    now = datetime.now(timezone.utc)
    _visible(db, me).filter(Notification.read_at.is_(None)).update(
        {Notification.read_at: now}, synchronize_session=False
    )
    db.commit()


@router.post("/{notification_id}/read", response_model=NotificationOut)
def mark_read(notification_id: str, db: DbDep, me: AuthDep):
    notification = (
        _visible(db, me).filter(Notification.id == notification_id).first()
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notification introuvable")

    if notification.read_at is None:
        notification.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(notification)
    return notification
