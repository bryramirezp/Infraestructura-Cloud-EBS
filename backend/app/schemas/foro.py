from pydantic import BaseModel, Field
from typing import Optional
import uuid
from datetime import datetime


class ForoComentarioBase(BaseModel):
    usuario_id: uuid.UUID = Field(..., description="ID del usuario que realiza el comentario")
    curso_id: uuid.UUID = Field(..., description="ID del curso asociado")
    leccion_id: uuid.UUID = Field(..., description="ID de la lección asociada")
    contenido: str = Field(..., min_length=1, max_length=5000, description="Contenido del comentario")


class ForoComentarioCreate(BaseModel):
    curso_id: uuid.UUID = Field(..., description="ID del curso asociado")
    leccion_id: uuid.UUID = Field(..., description="ID de la lección asociada")
    contenido: str = Field(..., min_length=1, max_length=5000, description="Contenido del comentario")


class ForoComentarioUpdate(BaseModel):
    contenido: str = Field(..., min_length=1, max_length=5000, description="Nuevo contenido del comentario")


class ForoComentarioResponse(ForoComentarioBase):
    id: uuid.UUID
    creado_en: Optional[datetime]
    actualizado_en: Optional[datetime]

    class Config:
        from_attributes = True
