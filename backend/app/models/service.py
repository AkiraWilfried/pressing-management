from sqlalchemy import Column, String, Integer, Float

from app.database import Base


class Service(Base):
    __tablename__ = "services"

    id = Column(String, primary_key=True, index=True)
    nom = Column(String, nullable=False)
    prix = Column(Float, nullable=False, default=0.0)
    delai = Column(Integer, nullable=False, default=24)  # délai en heures
