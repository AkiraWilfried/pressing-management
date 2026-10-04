from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(String, primary_key=True, index=True)
    nom = Column(String, nullable=False)
    telephone = Column(String, nullable=False)
    adresse = Column(String, nullable=False, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relations
    commandes = relationship("Commande", back_populates="client", cascade="all, delete-orphan")
