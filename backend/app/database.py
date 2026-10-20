from sqlalchemy import Column, DateTime, ForeignKey, String, create_engine, event, inspect
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from config import settings

# SQLite — check_same_thread=False requis pour FastAPI (multi-thread)
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)


# Sans ce pragma SQLite ignore les clés étrangères et tous les ON DELETE CASCADE des
# modèles restent inopérants — la purge laisserait des items et paiements orphelins.
@event.listens_for(engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, _connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class SoftDeletable:
    """Une suppression ne détruit rien : la ligne est marquée et reste visible du superadmin."""

    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)
    # SET NULL : purger un compte ne doit pas casser l'historique des suppressions
    deleted_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None


# Dépendance FastAPI — injecte une session DB dans chaque route
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Colonnes introduites par le RBAC. create_all() ne modifie jamais une table déjà créée,
# donc une vieille base passerait silencieusement au travers des nouveaux filtres.
_REQUIRED_COLUMNS = {
    "users": {"permissions"},
    "clients": {"deleted_at"},
    "commandes": {"deleted_at"},
    "services": {"deleted_at"},
    "paiements": {"deleted_at"},
}


def _ensure_schema():
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    stale = []
    for table, required in _REQUIRED_COLUMNS.items():
        if table not in tables:
            continue
        present = {column["name"] for column in inspector.get_columns(table)}
        if missing := required - present:
            stale.append(f"{table}.{', '.join(sorted(missing))}")

    if stale:
        raise RuntimeError(
            f"Schéma obsolète ({'; '.join(stale)}) — exécute "
            "`venv/bin/python reset_db.py --confirm` pour reconstruire la base"
        )


def create_tables():
    """Crée toutes tables si elles n'existent pas encore, sans jamais en altérer une."""
    # Import ici pour éviter les imports circulaires
    from app.models import (  # noqa: F401
        user,
        client,
        service,
        commande,
        paiement,
        notification,
    )

    _ensure_schema()
    Base.metadata.create_all(bind=engine)
