from pydantic import BaseModel, Field
from typing import Optional
import uuid
from datetime import datetime


class GuiaEstudioBase(BaseModel):
    curso_id: uuid.UUID = Field(..., description="ID del curso asociado")
    titulo: str = Field(..., min_length=1, max_length=200, description="Título de la guía de estudio")
    url: Optional[str] = Field(None, max_length=1000, description="URL de la guía de estudio")
    activo: Optional[bool] = Field(True, description="Indica si la guía está activa")


class GuiaEstudioResponse(GuiaEstudioBase):
    id: uuid.UUID
    creado_en: Optional[datetime]
    actualizado_en: Optional[datetime]

    class Config:
        from_attributes = True
