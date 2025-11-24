from pydantic import BaseModel, Field
from typing import Optional
import uuid
from datetime import datetime
from app.database.enums import TipoContenido


class LeccionBase(BaseModel):
    modulo_id: uuid.UUID = Field(..., description="ID del módulo asociado")
    titulo: str = Field(..., min_length=1, max_length=200, description="Título de la lección")
    orden: Optional[int] = Field(None, ge=0, description="Orden de aparición de la lección en el módulo")
    publicado: Optional[bool] = Field(False, description="Indica si la lección está publicada")


class LeccionCreate(LeccionBase):
    pass


class LeccionUpdate(BaseModel):
    titulo: Optional[str] = Field(None, min_length=1, max_length=200, description="Título de la lección")
    orden: Optional[int] = Field(None, ge=0, description="Orden de aparición de la lección en el módulo")
    publicado: Optional[bool] = Field(None, description="Indica si la lección está publicada")


class LeccionResponse(LeccionBase):
    id: uuid.UUID
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None

    class Config:
        from_attributes = True


class LeccionDetailResponse(LeccionResponse):
    contenido: list["LeccionContenidoResponse"] = []

    class Config:
        from_attributes = True


class LeccionContenidoBase(BaseModel):
    leccion_id: uuid.UUID = Field(..., description="ID de la lección asociada")
    tipo: TipoContenido = Field(..., description="Tipo de contenido (TEXTO, VIDEO, IMAGEN, ARCHIVO)")
    titulo: Optional[str] = Field(None, max_length=200, description="Título del contenido")
    descripcion: Optional[str] = Field(None, max_length=5000, description="Descripción o texto del contenido")
    url: Optional[str] = Field(None, max_length=500, description="URL del recurso (video, imagen, archivo)")
    orden: Optional[int] = Field(None, ge=0, description="Orden de aparición del contenido en la lección")


class LeccionContenidoCreate(LeccionContenidoBase):
    pass


class LeccionContenidoUpdate(BaseModel):
    tipo: Optional[TipoContenido] = Field(None, description="Tipo de contenido (TEXTO, VIDEO, IMAGEN, ARCHIVO)")
    titulo: Optional[str] = Field(None, max_length=200, description="Título del contenido")
    descripcion: Optional[str] = Field(None, max_length=5000, description="Descripción o texto del contenido")
    url: Optional[str] = Field(None, max_length=500, description="URL del recurso (video, imagen, archivo)")
    orden: Optional[int] = Field(None, ge=0, description="Orden de aparición del contenido en la lección")


class LeccionContenidoResponse(LeccionContenidoBase):
    id: uuid.UUID
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None

    class Config:
        from_attributes = True
