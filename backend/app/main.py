from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import SessionLocal, create_tables
from app.middleware import install_http_log
from app.routes import (
    auth_router,
    clients_router,
    commandes_router,
    notifications_router,
    paiements_router,
    services_router,
    trash_router,
    users_router,
)
from app.utils.seed import seed_superadmin
from config import settings


# ── Startup / Shutdown ────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Créer les tables SQLite au démarrage
    create_tables()

    db = SessionLocal()
    try:
        if seed_superadmin(db):
            print(
                f"✅ Compte superadmin créé : "
                f"{settings.SUPERADMIN_EMAIL} / {settings.SUPERADMIN_PASSWORD}"
            )
    finally:
        db.close()

    yield
    # Shutdown — rien à faire pour SQLite


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

# ── Journalisation des statuts HTTP et des messages d'erreur ─────────────────
install_http_log(app)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(clients_router)
app.include_router(services_router)
app.include_router(commandes_router)
app.include_router(paiements_router)
app.include_router(trash_router)
app.include_router(notifications_router)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/", tags=["health"])
def health():
    return {"status": "ok", "app": "Pressing API", "version": "1.0.0"}
