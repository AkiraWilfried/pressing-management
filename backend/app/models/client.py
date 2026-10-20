from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base, SoftDeletable


class Client(Base, SoftDeletable):
    __tablename__ = "clients"

    id = Column(String, primary_key=True, index=True)
    nom = Column(String, nullable=False)
    telephone = Column(String, nullable=False)
    adresse = Column(String, nullable=False, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # passive_deletes : une suppression de client ne détruit pas ses commandes, et la
    # purge laisse l'ORM intact — c'est ON DELETE CASCADE côté SQLite qui s'occupe des enfants.
    commandes = relationship("Commande", back_populates="client", passive_deletes=True)
