from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime
from decimal import Decimal
from app.database.enums import ResultadoIntento


class IntentoBase(BaseModel):
    usuario_id: uuid.UUID
    inscripcion_curso_id: uuid.UUID
    quiz_id: Optional[uuid.UUID] = None
    examen_final_id: Optional[uuid.UUID] = None
    numero_intento: int
    permitir_nuevo_intento: Optional[bool] = False


class IntentoResponse(IntentoBase):
    id: uuid.UUID
    puntaje: Optional[Decimal] = None
    resultado: Optional[ResultadoIntento] = None
    iniciado_en: Optional[datetime] = None
    finalizado_en: Optional[datetime] = None
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None

    class Config:
        from_attributes = True


class IntentoPreguntaBase(BaseModel):
    intento_id: uuid.UUID
    pregunta_id: uuid.UUID
    puntos_maximos: Optional[int] = None
    orden: Optional[int] = None


class RespuestaBase(BaseModel):
    intento_pregunta_id: uuid.UUID
    respuesta_texto: Optional[str] = None
    opcion_id: Optional[uuid.UUID] = None
    respuesta_bool: Optional[bool] = None


class RespuestaCreate(BaseModel):
    pregunta_id: uuid.UUID
    respuesta_texto: Optional[str] = None
    opcion_id: Optional[uuid.UUID] = None
    respuesta_bool: Optional[bool] = None


class RespuestaResponse(RespuestaBase):
    id: uuid.UUID
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None

    class Config:
        from_attributes = True


class IntentoSubmission(BaseModel):
    """Schema para enviar respuestas de un intento"""
    respuestas: List[RespuestaCreate]


class IntentoResult(BaseModel):
    """Schema para resultado de un intento"""
    intento_id: uuid.UUID
    puntaje: Optional[Decimal] = None
    puntaje_maximo: Optional[Decimal] = None
    porcentaje: Optional[Decimal] = None
    resultado: Optional[ResultadoIntento] = None
    aprobado: bool = False
    min_score_aprobatorio: Decimal
    preguntas_correctas: int = 0
    total_preguntas: int = 0
    respuestas: List[RespuestaResponse] = []

    class Config:
        from_attributes = True