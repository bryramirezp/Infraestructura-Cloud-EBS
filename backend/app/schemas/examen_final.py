from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional, List
import uuid
from datetime import datetime

from app.schemas.quiz import PreguntaConOpciones


# =====================================================
# ExamenFinal Schemas
# =====================================================

class ExamenFinalBase(BaseModel):
    curso_id: uuid.UUID = Field(..., description="ID del curso asociado")
    titulo: str = Field(..., min_length=1, max_length=200, description="Título del examen final")
    publicado: Optional[bool] = Field(False, description="Indica si el examen está publicado")
    aleatorio: Optional[bool] = Field(False, description="Indica si las preguntas se muestran en orden aleatorio")
    guarda_calificacion: Optional[bool] = Field(False, description="Indica si se guarda la calificación del intento")


class ExamenFinalCreate(ExamenFinalBase):
    pass


class ExamenFinalUpdate(BaseModel):
    titulo: Optional[str] = Field(None, min_length=1, max_length=200, description="Título del examen final")
    publicado: Optional[bool] = Field(None, description="Indica si el examen está publicado")
    aleatorio: Optional[bool] = Field(None, description="Indica si las preguntas se muestran en orden aleatorio")
    guarda_calificacion: Optional[bool] = Field(None, description="Indica si se guarda la calificación del intento")


class ExamenFinalResponse(ExamenFinalBase):
    id: uuid.UUID
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None

    class Config:
        from_attributes = True


class ExamenFinalDetailResponse(ExamenFinalResponse):
    numero_preguntas: Optional[int] = None

    class Config:
        from_attributes = True


class ExamenFinalConPreguntas(ExamenFinalDetailResponse):
    preguntas: List["PreguntaConOpciones"] = []

    class Config:
        from_attributes = True

