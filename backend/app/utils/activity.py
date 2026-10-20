from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User
from app.utils.id import generate_id

MESSAGES = {
    "delete": "« {label} » a été supprimé par {actor}",
    "restore": "« {label} » a été restauré par {actor}",
    "purge": "« {label} » a été supprimé définitivement par {actor}",
}


def record(
    db: Session,
    *,
    module: str,
    entity_id: str,
    entity_label: str,
    action: str,
    actor: User | None,
) -> Notification:
    """Journalise un événement. Pas de commit : la notification vit dans la même
    transaction que la suppression qu'elle raconte."""
    actor_nom = actor.nom if actor else "compte supprimé"
    notification = Notification(
        id=generate_id(),
        user_id=None,  # diffusion : le journal des suppressions est pour les superadmins
        module=module,
        entity_id=entity_id,
        entity_label=entity_label,
        action=action,
        actor_id=actor.id if actor else None,
        actor_nom=actor_nom,
        message=MESSAGES[action].format(label=entity_label, actor=actor_nom),
        # Horodatage posé ici : CURRENT_TIMESTAMP s'arrête à la seconde, deux events
        # simultanés se retrouvaient donc sans ordre dans la liste du superadmin.
        created_at=datetime.now(timezone.utc),
    )
    db.add(notification)
    return notification
