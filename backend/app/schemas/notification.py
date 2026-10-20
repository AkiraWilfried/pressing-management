from datetime import datetime

from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: str
    module: str
    entity_id: str
    entity_label: str
    action: str
    actor_nom: str
    message: str
    created_at: datetime
    read_at: datetime | None = None

    model_config = {"from_attributes": True}


class UnreadCount(BaseModel):
    count: int
