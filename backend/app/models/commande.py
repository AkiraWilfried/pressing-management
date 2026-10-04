from sqlalchemy import Column, String, Float, DateTime, Enum, ForeignKey, Integer, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class Commande(Base):
    __tablename__ = "commandes"

    id = Column(String, primary_key=True, index=True)
    client_id = Column(String, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    date_depot = Column(DateTime(timezone=True), nullable=False)
    date_retrait = Column(DateTime(timezone=True), nullable=False)
    statut = Column(
        Enum("En cours", "Lavé", "Repassé", "Prêt", "Retiré", "En retard", name="statut_commande"),
        default="En cours",
        nullable=False,
    )
    total = Column(Float, nullable=False, default=0.0)

    # Relations
    client = relationship("Client", back_populates="commandes")
    items = relationship("CommandeItem", back_populates="commande", cascade="all, delete-orphan")
    paiements = relationship("Paiement", back_populates="commande", cascade="all, delete-orphan")


class CommandeItem(Base):
    __tablename__ = "commande_items"

    id = Column(String, primary_key=True, index=True)
    commande_id = Column(String, ForeignKey("commandes.id", ondelete="CASCADE"), nullable=False, index=True)
    nom = Column(String, nullable=False)
    service = Column(String, nullable=False)
    quantite = Column(Integer, nullable=False, default=1)
    prix = Column(Float, nullable=False, default=0.0)
    # Stocké en JSON — liste de strings ["Noir Fendi", "Bleu Dior"]
    references = Column(JSON, nullable=False, default=list)

    # Relation
    commande = relationship("Commande", back_populates="items")
