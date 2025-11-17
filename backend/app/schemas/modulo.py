from __future__ import annotations

from pydantic import BaseModel
from typing import Optional, List, TYPE_CHECKING
import uuid
from datetime import date, datetime

if TYPE_CHECKING:
    from app.schemas.curso import CursoResponse


class ModuloBase(BaseModel):
    titulo: str
    fecha_inicio: date
    fecha_fin: date
    publicado: Optional[bool] = False


class ModuloCreate(ModuloBase):
    pass


class ModuloUpdate(BaseModel):
    titulo: Optional[str] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    publicado: Optional[bool] = None


class ModuloResponse(ModuloBase):
    id: uuid.UUID
    creado_en: Optional[datetime]
    actualizado_en: Optional[datetime]

    class Config:
        orm_mode = True


class ModuloCursoItem(BaseModel):
    curso: "CursoResponse"
    slot: int

    class Config:
        orm_mode = True


class ModuloDetailResponse(ModuloResponse):
    cursos: List[ModuloCursoItem] = []

    class Config:
        orm_mode = True


ModuloCursoItem.update_forward_refs()
ModuloDetailResponse.update_forward_refs()
