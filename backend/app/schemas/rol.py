from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime


class RolBase(BaseModel):
    nombre: str


class RolResponse(RolBase):
    id: uuid.UUID
    creado_en: Optional[datetime]
    actualizado_en: Optional[datetime]

    class Config:
        from_attributes = True
