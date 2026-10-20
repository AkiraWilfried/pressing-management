#!/usr/bin/env python
"""Vide puis recrée la base SQLite du Pressing.

La destruction n'est jamais automatique : sans --confirm, le script refuse d'agir,
et il ne touche à rien d'autre qu'un fichier SQLite local.
"""

import argparse
import os
import sys

from sqlalchemy import text

from app.database import Base, SessionLocal, create_tables, engine
from app.utils.seed import seed_superadmin
from config import settings

SQLITE_PREFIX = "sqlite:///"


def _table_counts() -> dict[str, int]:
    counts: dict[str, int] = {}
    db = SessionLocal()
    try:
        for table in Base.metadata.tables:
            try:
                counts[table] = db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar_one()
            except Exception:  # table absente — rien à compter
                db.rollback()
                counts[table] = 0
    finally:
        db.close()
    return counts


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--confirm",
        action="store_true",
        required=True,
        help="accepter la destruction des données existantes",
    )
    args = parser.parse_args()

    url = settings.DATABASE_URL
    if not url.startswith(SQLITE_PREFIX):
        sys.exit(f"✗ DATABASE_URL={url} — ce script n'écrase qu'un fichier SQLite local")

    path = url[len(SQLITE_PREFIX) :]
    if not path or path == ":memory:":
        sys.exit("✗ Base en mémoire — rien à réinitialiser sur disque")

    db_file = os.path.abspath(path)
    print(f"Base     : {db_file}")
    for table, count in _table_counts().items():
        print(f"  {table:<18} {count} ligne(s)")

    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    for suffix in ("", "-wal", "-shm"):
        if os.path.exists(db_file + suffix):
            os.remove(db_file + suffix)

    create_tables()

    db = SessionLocal()
    try:
        seeded = seed_superadmin(db)
    finally:
        db.close()

    print("✔ Base reconstruite, toutes les tables vides")
    if seeded:
        print(
            f"  Superadministrateur : {settings.SUPERADMIN_EMAIL} / "
            f"{settings.SUPERADMIN_PASSWORD}"
        )


if __name__ == "__main__":
    main()
