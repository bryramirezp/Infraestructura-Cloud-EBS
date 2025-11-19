from __future__ import annotations

from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime
from app.database.enums import TipoPregunta


# =====================================================
# Quiz Schemas
# =====================================================

class QuizBase(BaseModel):
    leccion_id: uuid.UUID
    titulo: str
    publicado: Optional[bool] = False
    aleatorio: Optional[bool] = False
    guarda_calificacion: Optional[bool] = False


class QuizCreate(QuizBase):
    pass


class QuizUpdate(BaseModel):
    titulo: Optional[str] = None
    publicado: Optional[bool] = None
    aleatorio: Optional[bool] = None
    guarda_calificacion: Optional[bool] = None


class QuizResponse(QuizBase):
    id: uuid.UUID
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None

    class Config:
        from_attributes = True


class QuizDetailResponse(QuizResponse):
    numero_preguntas: Optional[int] = None

    class Config:
        from_attributes = True


# =====================================================
# Pregunta Schemas
# =====================================================

class PreguntaBase(BaseModel):
    quiz_id: Optional[uuid.UUID] = None
    examen_final_id: Optional[uuid.UUID] = None
    enunciado: str
    puntos: Optional[int] = None
    orden: Optional[int] = None


class PreguntaCreate(PreguntaBase):
    pass


class PreguntaUpdate(BaseModel):
    enunciado: Optional[str] = None
    puntos: Optional[int] = None
    orden: Optional[int] = None


class PreguntaResponse(PreguntaBase):
    id: uuid.UUID
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None

    class Config:
        from_attributes = True


# =====================================================
# PreguntaConfig Schemas
# =====================================================

class PreguntaConfigBase(BaseModel):
    pregunta_id: uuid.UUID
    tipo: TipoPregunta
    abierta_modelo_respuesta: Optional[str] = None
    om_seleccion_multiple: Optional[bool] = None
    om_min_selecciones: Optional[int] = None
    om_max_selecciones: Optional[int] = None
    vf_respuesta_correcta: Optional[bool] = None
    penaliza_error: Optional[bool] = False
    puntos_por_opcion: Optional[int] = None


class PreguntaConfigCreate(PreguntaConfigBase):
    pass


class PreguntaConfigUpdate(BaseModel):
    tipo: Optional[TipoPregunta] = None
    abierta_modelo_respuesta: Optional[str] = None
    om_seleccion_multiple: Optional[bool] = None
    om_min_selecciones: Optional[int] = None
    om_max_selecciones: Optional[int] = None
    vf_respuesta_correcta: Optional[bool] = None
    penaliza_error: Optional[bool] = None
    puntos_por_opcion: Optional[int] = None


class PreguntaConfigResponse(PreguntaConfigBase):
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None

    class Config:
        from_attributes = True


# =====================================================
# Opcion Schemas
# =====================================================

class OpcionBase(BaseModel):
    pregunta_id: uuid.UUID
    texto: str
    es_correcta: Optional[bool] = False
    orden: Optional[int] = None


class OpcionCreate(OpcionBase):
    pass


class OpcionUpdate(BaseModel):
    texto: Optional[str] = None
    es_correcta: Optional[bool] = None
    orden: Optional[int] = None


class OpcionResponse(OpcionBase):
    id: uuid.UUID
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None

    class Config:
        from_attributes = True


# =====================================================
# Combined Schemas (Pregunta con Opciones)
# =====================================================

class PreguntaConOpciones(PreguntaResponse):
    opciones: List[OpcionResponse] = []
    config: Optional[PreguntaConfigResponse] = None

    class Config:
        from_attributes = True


class QuizConPreguntas(QuizDetailResponse):
    preguntas: List[PreguntaConOpciones] = []

    class Config:
        from_attributes = True

