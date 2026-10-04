import uuid


def generate_id() -> str:
    """Génère un UUID4 court sous forme de string."""
    return str(uuid.uuid4())
