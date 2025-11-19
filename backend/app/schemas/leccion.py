from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime
from app.database.enums import TipoContenido


class LeccionBase(BaseModel):
    modulo_id: uuid.UUID
    titulo: str
    orden: Optional[int] = None
    publicado: Optional[bool] = False


class LeccionCreate(LeccionBase):
    pass


class LeccionUpdate(BaseModel):
    titulo: Optional[str] = None
    orden: Optional[int] = None
    publicado: Optional[bool] = None


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
    leccion_id: uuid.UUID
    tipo: TipoContenido
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    url: Optional[str] = None
    orden: Optional[int] = None


class LeccionContenidoCreate(LeccionContenidoBase):
    pass


class LeccionContenidoUpdate(BaseModel):
    tipo: Optional[TipoContenido] = None
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    url: Optional[str] = None
    orden: Optional[int] = None


class LeccionContenidoResponse(LeccionContenidoBase):
    id: uuid.UUID
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None

    class Config:
        from_attributes = True
