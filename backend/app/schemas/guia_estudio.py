from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime


class GuiaEstudioBase(BaseModel):
    curso_id: uuid.UUID
    titulo: str
    url: Optional[str] = None
    activo: Optional[bool] = True


class GuiaEstudioResponse(GuiaEstudioBase):
    id: uuid.UUID
    creado_en: Optional[datetime]
    actualizado_en: Optional[datetime]

    class Config:
        orm_mode = True
