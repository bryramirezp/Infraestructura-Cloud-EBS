from pydantic import BaseModel, Field
from typing import Optional
import uuid
from datetime import datetime


class ReglaAcreditacionBase(BaseModel):
    curso_id: uuid.UUID = Field(..., description="ID del curso asociado")
    quiz_id: Optional[uuid.UUID] = Field(None, description="ID del quiz asociado (opcional si aplica solo a examen final)")
    examen_final_id: Optional[uuid.UUID] = Field(None, description="ID del examen final asociado (opcional si aplica solo a quiz)")
    min_score_aprobatorio: Optional[float] = Field(80.0, ge=0, le=100, description="Puntuación mínima requerida para aprobar (0-100)")
    max_intentos_quiz: Optional[int] = Field(3, ge=1, description="Número máximo de intentos permitidos para el quiz")
    bloquea_curso_por_reprobacion_quiz: Optional[bool] = Field(True, description="Indica si el curso se bloquea al reprobar el quiz")
    activa: Optional[bool] = Field(True, description="Indica si la regla está activa")


class ReglaAcreditacionResponse(ReglaAcreditacionBase):
    id: uuid.UUID
    creado_en: Optional[datetime]
    actualizado_en: Optional[datetime]

    class Config:
        from_attributes = True
