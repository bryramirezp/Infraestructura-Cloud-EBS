from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime, date
from app.database.enums import EstadoInscripcion


class InscripcionCursoBase(BaseModel):
    usuario_id: uuid.UUID
    curso_id: uuid.UUID
    estado: Optional[EstadoInscripcion] = EstadoInscripcion.ACTIVO
    fecha_inscripcion: Optional[datetime] = None


class InscripcionCursoCreate(BaseModel):
    curso_id: uuid.UUID


class InscripcionCursoResponse(InscripcionCursoBase):
    id: uuid.UUID
    acreditado: bool
    acreditado_en: Optional[datetime] = None
    fecha_conclusion: Optional[date] = None
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None

    class Config:
        orm_mode = True
