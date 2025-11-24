from pydantic import BaseModel, Field
from typing import Optional
import uuid
from datetime import date, datetime
from app.database.enums import EstadoInscripcion


class InscripcionBase(BaseModel):
    usuario_id: uuid.UUID = Field(..., description="ID del usuario inscrito")
    curso_id: uuid.UUID = Field(..., description="ID del curso al que se inscribe")
    fecha_inscripcion: date = Field(..., description="Fecha en que se realizó la inscripción")
    estado: Optional[EstadoInscripcion] = Field(EstadoInscripcion.ACTIVA, description="Estado actual de la inscripción")


class InscripcionCreate(BaseModel):
    curso_id: uuid.UUID = Field(..., description="ID del curso al que se inscribe")
    fecha_inscripcion: Optional[date] = Field(None, description="Fecha de inscripción (por defecto: fecha actual)")


class InscripcionUpdate(BaseModel):
    estado: Optional[EstadoInscripcion] = Field(None, description="Nuevo estado de la inscripción")


class InscripcionEstadoUpdate(BaseModel):
    """Schema para actualizar estado de inscripción vía PATCH"""
    estado: EstadoInscripcion = Field(..., description="Nuevo estado de la inscripción (PAUSADA, ACTIVA, CONCLUIDA, REPROBADA)")


class InscripcionResponse(InscripcionBase):
    id: uuid.UUID
    acreditado: bool
    acreditado_en: Optional[datetime] = None
    fecha_conclusion: Optional[date] = None
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None

    class Config:
        from_attributes = True
