from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from config import settings

# SQLite — check_same_thread=False requis pour FastAPI (multi-thread)
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


# Dépendance FastAPI — injecte une session DB dans chaque route
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Crée toutes les tables si elles n'existent pas encore."""
    # Import ici pour éviter les imports circulaires
    from app.models import user, client, service, commande, paiement  # noqa: F401
    Base.metadata.create_all(bind=engine)
