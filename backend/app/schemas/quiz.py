from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional, List
import uuid
from datetime import datetime
from app.database.enums import TipoPregunta


# =====================================================
# Quiz Schemas
# =====================================================

class QuizBase(BaseModel):
    leccion_id: uuid.UUID = Field(..., description="ID de la lección asociada")
    titulo: str = Field(..., min_length=1, max_length=200, description="Título del quiz")
    publicado: Optional[bool] = Field(False, description="Indica si el quiz está publicado")
    aleatorio: Optional[bool] = Field(False, description="Indica si las preguntas se muestran en orden aleatorio")
    guarda_calificacion: Optional[bool] = Field(False, description="Indica si se guarda la calificación del intento")


class QuizCreate(QuizBase):
    pass


class QuizUpdate(BaseModel):
    titulo: Optional[str] = Field(None, min_length=1, max_length=200, description="Título del quiz")
    publicado: Optional[bool] = Field(None, description="Indica si el quiz está publicado")
    aleatorio: Optional[bool] = Field(None, description="Indica si las preguntas se muestran en orden aleatorio")
    guarda_calificacion: Optional[bool] = Field(None, description="Indica si se guarda la calificación del intento")


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
    quiz_id: Optional[uuid.UUID] = Field(None, description="ID del quiz asociado (opcional si pertenece a examen final)")
    examen_final_id: Optional[uuid.UUID] = Field(None, description="ID del examen final asociado (opcional si pertenece a quiz)")
    enunciado: str = Field(..., min_length=1, max_length=2000, description="Texto del enunciado de la pregunta")
    puntos: Optional[int] = Field(None, ge=0, description="Puntos que vale la pregunta")
    orden: Optional[int] = Field(None, ge=0, description="Orden de aparición de la pregunta")


class PreguntaCreate(PreguntaBase):
    pass


class PreguntaUpdate(BaseModel):
    enunciado: Optional[str] = Field(None, min_length=1, max_length=2000, description="Texto del enunciado de la pregunta")
    puntos: Optional[int] = Field(None, ge=0, description="Puntos que vale la pregunta")
    orden: Optional[int] = Field(None, ge=0, description="Orden de aparición de la pregunta")


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
    pregunta_id: uuid.UUID = Field(..., description="ID de la pregunta asociada")
    tipo: TipoPregunta = Field(..., description="Tipo de pregunta (ABIERTA, OPCION_MULTIPLE, VERDADERO_FALSO)")
    abierta_modelo_respuesta: Optional[str] = Field(None, max_length=5000, description="Modelo de respuesta esperada para preguntas abiertas")
    om_seleccion_multiple: Optional[bool] = Field(None, description="Indica si permite selección múltiple (solo para OPCION_MULTIPLE)")
    om_min_selecciones: Optional[int] = Field(None, ge=1, description="Mínimo de opciones a seleccionar (solo para selección múltiple)")
    om_max_selecciones: Optional[int] = Field(None, ge=1, description="Máximo de opciones a seleccionar (solo para selección múltiple)")
    vf_respuesta_correcta: Optional[bool] = Field(None, description="Respuesta correcta para preguntas verdadero/falso")
    penaliza_error: Optional[bool] = Field(False, description="Indica si se penaliza por respuesta incorrecta")
    puntos_por_opcion: Optional[int] = Field(None, ge=0, description="Puntos asignados por cada opción seleccionada correctamente")


class PreguntaConfigCreate(PreguntaConfigBase):
    pass


class PreguntaConfigUpdate(BaseModel):
    tipo: Optional[TipoPregunta] = Field(None, description="Tipo de pregunta (ABIERTA, OPCION_MULTIPLE, VERDADERO_FALSO)")
    abierta_modelo_respuesta: Optional[str] = Field(None, max_length=5000, description="Modelo de respuesta esperada para preguntas abiertas")
    om_seleccion_multiple: Optional[bool] = Field(None, description="Indica si permite selección múltiple (solo para OPCION_MULTIPLE)")
    om_min_selecciones: Optional[int] = Field(None, ge=1, description="Mínimo de opciones a seleccionar (solo para selección múltiple)")
    om_max_selecciones: Optional[int] = Field(None, ge=1, description="Máximo de opciones a seleccionar (solo para selección múltiple)")
    vf_respuesta_correcta: Optional[bool] = Field(None, description="Respuesta correcta para preguntas verdadero/falso")
    penaliza_error: Optional[bool] = Field(None, description="Indica si se penaliza por respuesta incorrecta")
    puntos_por_opcion: Optional[int] = Field(None, ge=0, description="Puntos asignados por cada opción seleccionada correctamente")


class PreguntaConfigResponse(PreguntaConfigBase):
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None

    class Config:
        from_attributes = True


# =====================================================
# Opcion Schemas
# =====================================================

class OpcionBase(BaseModel):
    pregunta_id: uuid.UUID = Field(..., description="ID de la pregunta asociada")
    texto: str = Field(..., min_length=1, max_length=1000, description="Texto de la opción")
    es_correcta: Optional[bool] = Field(False, description="Indica si esta opción es la respuesta correcta")
    orden: Optional[int] = Field(None, ge=0, description="Orden de aparición de la opción")


class OpcionCreate(OpcionBase):
    pass


class OpcionUpdate(BaseModel):
    texto: Optional[str] = Field(None, min_length=1, max_length=1000, description="Texto de la opción")
    es_correcta: Optional[bool] = Field(None, description="Indica si esta opción es la respuesta correcta")
    orden: Optional[int] = Field(None, ge=0, description="Orden de aparición de la opción")


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

