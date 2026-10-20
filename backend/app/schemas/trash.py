from datetime import datetime

from pydantic import BaseModel


class TrashItem(BaseModel):
    module: str
    id: str
    label: str
    deleted_at: datetime
    deleted_by: str | None = None
    # Snapshot ou « compte supprimé » — la ligne de corbeille doit rester lisible
    deleted_by_nom: str
    # Faux quand le parent est encore en corbeille (commande d'un client supprimé)
    restorable: bool = True


class TrashAction(BaseModel):
    """Acquit d'une restauration — le frontend reliste la corbeille après coup."""

    module: str
    id: str
    label: str
    action: str
