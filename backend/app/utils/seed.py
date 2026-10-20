from sqlalchemy.orm import Session

from app.models.user import User
from app.utils.auth import hash_password
from app.utils.id import generate_id
from config import settings


def seed_superadmin(db: Session) -> bool:
    """Crée le compte superadmin si la table est vide. Retourne True s'il a été créé."""
    if db.query(User).count() > 0:
        return False

    db.add(
        User(
            id=generate_id(),
            nom="Superadministrateur",
            email=settings.SUPERADMIN_EMAIL,
            hashed_password=hash_password(settings.SUPERADMIN_PASSWORD),
            role="superadmin",
            permissions={},  # contournement implicite via le rôle
        )
    )
    db.commit()
    return True
