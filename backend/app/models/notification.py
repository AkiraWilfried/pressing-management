from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.sql import func

from app.database import Base


class Notification(Base):
    """Event d'activité — persisté, parce qu'une ligne purgée doit rester racontable."""

    __tablename__ = "notifications"

    id = Column(String, primary_key=True, index=True)
    # NULL = diffusion aux superadmins (journal des suppressions) ; sinon destinataire nommé
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)

    module = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    entity_label = Column(String, nullable=False)
    action = Column(String, nullable=False)  # delete | restore | purge

    actor_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    # Snapshot du nom : l'auteur peut être renommé ou supprimé après coup
    actor_nom = Column(String, nullable=False, default="")

    message = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
