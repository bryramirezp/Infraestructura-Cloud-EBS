from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional, List
import uuid
from datetime import date, datetime

from app.schemas.curso import CursoResponse


class ModuloBase(BaseModel):
    titulo: str = Field(..., min_length=1, max_length=200, description="Título del módulo")
    fecha_inicio: date = Field(..., description="Fecha de inicio del módulo")
    fecha_fin: date = Field(..., description="Fecha de fin del módulo")
    publicado: Optional[bool] = Field(False, description="Indica si el módulo está publicado")


class ModuloCreate(ModuloBase):
    pass


class ModuloUpdate(BaseModel):
    titulo: Optional[str] = Field(None, min_length=1, max_length=200, description="Título del módulo")
    fecha_inicio: Optional[date] = Field(None, description="Fecha de inicio del módulo")
    fecha_fin: Optional[date] = Field(None, description="Fecha de fin del módulo")
    publicado: Optional[bool] = Field(None, description="Indica si el módulo está publicado")


class ModuloResponse(ModuloBase):
    id: uuid.UUID
    creado_en: Optional[datetime]
    actualizado_en: Optional[datetime]

    class Config:
        from_attributes = True


class ModuloCursoItem(BaseModel):
    curso: CursoResponse
    slot: int

    class Config:
        from_attributes = True


class ModuloDetailResponse(ModuloResponse):
    cursos: List[ModuloCursoItem] = []

    class Config:
        from_attributes = True
