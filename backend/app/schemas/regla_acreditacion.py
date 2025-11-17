from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime


class ReglaAcreditacionBase(BaseModel):
    curso_id: uuid.UUID
    quiz_id: Optional[uuid.UUID] = None
    examen_final_id: Optional[uuid.UUID] = None
    min_score_aprobatorio: Optional[float] = 80.0
    max_intentos_quiz: Optional[int] = 3
    bloquea_curso_por_reprobacion_quiz: Optional[bool] = True
    activa: Optional[bool] = True


class ReglaAcreditacionResponse(ReglaAcreditacionBase):
    id: uuid.UUID
    creado_en: Optional[datetime]
    actualizado_en: Optional[datetime]

    class Config:
        orm_mode = True
