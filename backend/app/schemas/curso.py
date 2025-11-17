from __future__ import annotations

from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime

from app.schemas.guia_estudio import GuiaEstudioResponse


class CursoBase(BaseModel):
    titulo: str
    descripcion: Optional[str] = None
    publicado: Optional[bool] = False


class CursoCreate(CursoBase):
    pass


class CursoUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    publicado: Optional[bool] = None


class CursoResponse(CursoBase):
    id: uuid.UUID
    creado_en: Optional[datetime]
    actualizado_en: Optional[datetime]

    class Config:
        orm_mode = True


class CursoDetailResponse(CursoResponse):
    examen_final_id: Optional[uuid.UUID] = None
    guias_estudio: List[GuiaEstudioResponse] = []

    class Config:
        orm_mode = True


CursoDetailResponse.update_forward_refs()
