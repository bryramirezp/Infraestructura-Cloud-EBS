from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime
from decimal import Decimal
from app.database.enums import TipoPregunta


class QuizBase(BaseModel):
    leccion_id: uuid.UUID
    titulo: str
    publicado: Optional[bool] = False
    aleatorio: Optional[bool] = False
    guarda_calificacion: Optional[bool] = False


class QuizResponse(QuizBase):
    id: uuid.UUID
    creado_en: Optional[datetime]
    actualizado_en: Optional[datetime]

    class Config:
        orm_mode = True


class ExamenFinalBase(BaseModel):
    curso_id: uuid.UUID
    titulo: str
    publicado: Optional[bool] = False
    aleatorio: Optional[bool] = False
    guarda_calificacion: Optional[bool] = False


class ExamenFinalResponse(ExamenFinalBase):
    id: uuid.UUID
    creado_en: Optional[datetime]
    actualizado_en: Optional[datetime]

    class Config:
        orm_mode = True


class PreguntaBase(BaseModel):
    quiz_id: Optional[uuid.UUID] = None
    examen_final_id: Optional[uuid.UUID] = None
    enunciado: str
    puntos: Optional[int] = None
    orden: Optional[int] = None


class PreguntaResponse(PreguntaBase):
    id: uuid.UUID
    creado_en: Optional[datetime]
    actualizado_en: Optional[datetime]

    class Config:
        orm_mode = True


class PreguntaConfigBase(BaseModel):
    pregunta_id: uuid.UUID
    tipo: TipoPregunta
    abierta_modelo_respuesta: Optional[str] = None
    om_seleccion_multiple: Optional[bool] = None
    om_min_selecciones: Optional[int] = None
    om_max_selecciones: Optional[int] = None
    vf_respuesta_correcta: Optional[bool] = None
    penaliza_error: Optional[bool] = None
    puntos_por_opcion: Optional[int] = None


class OpcionBase(BaseModel):
    pregunta_id: uuid.UUID
    texto: str
    es_correcta: Optional[bool] = False
    orden: Optional[int] = None


class OpcionResponse(OpcionBase):
    id: uuid.UUID
    creado_en: Optional[datetime]
    actualizado_en: Optional[datetime]

    class Config:
        orm_mode = True
