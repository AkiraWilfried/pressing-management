from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import create_tables, SessionLocal
from app.routes import (
    auth_router,
    clients_router,
    services_router,
    commandes_router,
    paiements_router,
)


# ── Startup / Shutdown ────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Créer les tables SQLite au démarrage
    create_tables()
    # Seed : créer l'utilisateur admin s'il n'existe pas
    _seed_admin()
    yield
    # Shutdown — rien à faire pour SQLite


def _seed_admin():
    """Crée les comptes par défaut si aucun utilisateur n'existe."""
    from app.models.user import User
    from app.utils.auth import hash_password
    from app.utils.id import generate_id

    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            db.add(User(
                id=generate_id(),
                nom="Administrateur",
                email="admin@pressing.cm",
                hashed_password=hash_password("admin123"),
                role="admin",
            ))
            db.add(User(
                id=generate_id(),
                nom="Utilisateur",
                email="user@pressing.cm",
                hashed_password=hash_password("user123"),
                role="user",
            ))
            db.commit()
            print("✅ Comptes créés : admin@pressing.cm/admin123 · user@pressing.cm/user123")
    finally:
        db.close()


# ── Application ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="Pressing API",
    description="API de gestion du pressing — clients, commandes, services, paiements",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS — autorise le frontend Vite (port 5173) ─────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:4173",
        "http://127.0.0.1:5173",
        "http://localhost:5199",
        "http://127.0.0.1:5199",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(clients_router)
app.include_router(services_router)
app.include_router(commandes_router)
app.include_router(paiements_router)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/", tags=["health"])
def health():
    return {"status": "ok", "app": "Pressing API", "version": "1.0.0"}
