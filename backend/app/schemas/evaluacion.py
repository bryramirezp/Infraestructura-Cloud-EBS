from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime
from app.database.enums import TipoPregunta


# --- Quiz ---

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
    creado_en: Optional[datetime]
    actualizado_en: Optional[datetime]

    class Config:
        orm_mode = True


# --- Examen Final ---

class ExamenFinalBase(BaseModel):
    curso_id: uuid.UUID
    titulo: str
    publicado: Optional[bool] = False
    aleatorio: Optional[bool] = False
    guarda_calificacion: Optional[bool] = False


class ExamenFinalCreate(ExamenFinalBase):
    pass


class ExamenFinalUpdate(BaseModel):
    titulo: Optional[str] = None
    publicado: Optional[bool] = None
    aleatorio: Optional[bool] = None
    guarda_calificacion: Optional[bool] = None


class ExamenFinalResponse(ExamenFinalBase):
    id: uuid.UUID
    creado_en: Optional[datetime]
    actualizado_en: Optional[datetime]

    class Config:
        orm_mode = True


# --- Preguntas ---

class PreguntaBase(BaseModel):
    quiz_id: Optional[uuid.UUID] = None
    examen_final_id: Optional[uuid.UUID] = None
    texto_pregunta: str
    tipo: TipoPregunta
    orden: Optional[int] = None
    puntos: Optional[int] = 1


class PreguntaCreate(PreguntaBase):
    pass


class PreguntaUpdate(BaseModel):
    texto_pregunta: Optional[str] = None
    tipo: Optional[TipoPregunta] = None
    orden: Optional[int] = None
    puntos: Optional[int] = None


class PreguntaResponse(PreguntaBase):
    id: uuid.UUID
    creado_en: Optional[datetime]
    actualizado_en: Optional[datetime]

    class Config:
        orm_mode = True


# --- Opciones ---

class OpcionBase(BaseModel):
    pregunta_id: uuid.UUID
    texto_opcion: str
    es_correcta: bool
    orden: Optional[int] = None


class OpcionCreate(OpcionBase):
    pass


class OpcionUpdate(BaseModel):
    texto_opcion: Optional[str] = None
    es_correcta: Optional[bool] = None
    orden: Optional[int] = None


class OpcionResponse(OpcionBase):
    id: uuid.UUID
    creado_en: Optional[datetime]
    actualizado_en: Optional[datetime]

    class Config:
        orm_mode = True
