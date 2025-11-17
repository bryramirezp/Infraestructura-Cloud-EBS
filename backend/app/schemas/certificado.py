from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime


class CertificadoBase(BaseModel):
    inscripcion_curso_id: uuid.UUID
    folio: Optional[str] = None
    hash_verificacion: Optional[str] = None
    s3_key: Optional[str] = None


class CertificadoResponse(CertificadoBase):
    id: uuid.UUID
    emitido_en: Optional[datetime]
    valido: bool
    creado_en: Optional[datetime]
    actualizado_en: Optional[datetime]

    class Config:
        orm_mode = True
