from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime


class ForoComentarioBase(BaseModel):
    usuario_id: uuid.UUID
    curso_id: uuid.UUID
    leccion_id: uuid.UUID
    contenido: str


class ForoComentarioCreate(BaseModel):
    leccion_id: uuid.UUID
    contenido: str


class ForoComentarioResponse(ForoComentarioBase):
    id: uuid.UUID
    creado_en: Optional[datetime]
    actualizado_en: Optional[datetime]
    usuario_nombre: Optional[str] = None # Para mostrar nombre del usuario
    usuario_apellido: Optional[str] = None

    class Config:
        orm_mode = True
