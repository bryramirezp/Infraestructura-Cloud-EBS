from __future__ import annotations

from pydantic import BaseModel
from typing import Optional, List, TYPE_CHECKING
import uuid
from datetime import datetime

if TYPE_CHECKING:
    from app.schemas.quiz import PreguntaConOpciones


# =====================================================
# ExamenFinal Schemas
# =====================================================

class ExamenFinalBase(BaseModel):
    curso_id: uuid.UUID
    titulo: str
    publicado: Optional[bool] = False
    aleatorio: Optional[bool] = False
    guarda_calificacion: Optional[bool] = False


class ExamenFinalCreate(ExamenFinalBase):
    pass


class ExamenFinalUpdate(BaseModel):
    titulo: Optional[str] = None
    publicado: Optional[bool] = None
    aleatorio: Optional[bool] = None
    guarda_calificacion: Optional[bool] = None


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

