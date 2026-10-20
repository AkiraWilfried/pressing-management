from app.routes.auth import router as auth_router
from app.routes.clients import router as clients_router
from app.routes.services import router as services_router
from app.routes.commandes import router as commandes_router
from app.routes.paiements import router as paiements_router
from app.routes.users import router as users_router
from app.routes.trash import router as trash_router
from app.routes.notifications import router as notifications_router

__all__ = [
    "auth_router",
    "clients_router",
    "services_router",
    "commandes_router",
    "paiements_router",
    "users_router",
    "trash_router",
    "notifications_router",
]
