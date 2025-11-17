from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import date, datetime
from app.database.enums import EstadoInscripcion


class InscripcionBase(BaseModel):
    usuario_id: uuid.UUID
    curso_id: uuid.UUID
    fecha_inscripcion: date
    estado: Optional[EstadoInscripcion] = EstadoInscripcion.ACTIVA


class InscripcionResponse(InscripcionBase):
    id: uuid.UUID
    acreditado: bool
    acreditado_en: Optional[datetime] = None
    fecha_conclusion: Optional[date] = None
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None

    class Config:
        orm_mode = True
