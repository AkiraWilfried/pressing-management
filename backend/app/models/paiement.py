from sqlalchemy import Column, String, Float, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Paiement(Base):
    __tablename__ = "paiements"

    id = Column(String, primary_key=True, index=True)
    commande_id = Column(String, ForeignKey("commandes.id", ondelete="CASCADE"), nullable=False, index=True)
    montant = Column(Float, nullable=False)
    date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    mode_paiement = Column(
        Enum("Cash", "Mobile Money", "Orange Money", name="mode_paiement"),
        nullable=False,
        default="Cash",
    )

    # Relation
    commande = relationship("Commande", back_populates="paiements")
