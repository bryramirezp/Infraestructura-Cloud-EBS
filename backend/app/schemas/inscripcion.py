from pydantic import BaseModel, Field
from typing import Optional
import uuid
from datetime import datetime, date
from app.database.enums import EstadoInscripcion


<<<<<<< HEAD
class InscripcionCursoBase(BaseModel):
    usuario_id: uuid.UUID
    curso_id: uuid.UUID
    estado: Optional[EstadoInscripcion] = EstadoInscripcion.ACTIVO
    fecha_inscripcion: Optional[datetime] = None
=======
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
>>>>>>> 50bb6094d50d71301466789ca430ba62ffdca6f9


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
        from_attributes = True
