from sqlalchemy import Column, JSON, String

from app.database import Base, SoftDeletable


class User(Base, SoftDeletable):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    nom = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    # Pas d'Enum : SQLAlchemy valide les valeurs à la lecture, ce qui lèverait
    # LookupError sur une base contenant déjà "superadmin". Literal côté Pydantic suffit.
    role = Column(String, default="agent", nullable=False)
    # {clients: {view, create, edit, delete}, …, users: bool} — ignoré par les superadmins
    permissions = Column(JSON, nullable=False, default=dict)
