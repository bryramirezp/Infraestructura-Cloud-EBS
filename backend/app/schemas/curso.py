from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional, List
import uuid
from datetime import datetime

from app.schemas.guia_estudio import GuiaEstudioResponse


class CursoBase(BaseModel):
    titulo: str = Field(..., min_length=1, max_length=200, description="Título del curso")
    descripcion: Optional[str] = Field(None, max_length=5000, description="Descripción del curso")
    publicado: Optional[bool] = False


class CursoCreate(CursoBase):
    pass


class CursoUpdate(BaseModel):
    titulo: Optional[str] = Field(None, min_length=1, max_length=200, description="Título del curso")
    descripcion: Optional[str] = Field(None, max_length=5000, description="Descripción del curso")
    publicado: Optional[bool] = None


class CursoResponse(CursoBase):
    id: uuid.UUID
    creado_en: Optional[datetime]
    actualizado_en: Optional[datetime]

    class Config:
        from_attributes = True


class CursoDetailResponse(CursoResponse):
    examen_final_id: Optional[uuid.UUID] = None
    guias_estudio: List[GuiaEstudioResponse] = []

    class Config:
        from_attributes = True
