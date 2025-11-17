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


class LeccionResponse(LeccionBase):
    id: uuid.UUID
    creado_en: Optional[datetime]
    actualizado_en: Optional[datetime]

    class Config:
        orm_mode = True


class LeccionContenidoBase(BaseModel):
    leccion_id: uuid.UUID
    tipo: TipoContenido
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    url: Optional[str] = None
    orden: Optional[int] = None


class LeccionContenidoResponse(LeccionContenidoBase):
    id: uuid.UUID
    creado_en: Optional[datetime]
    actualizado_en: Optional[datetime]

    class Config:
        orm_mode = True
