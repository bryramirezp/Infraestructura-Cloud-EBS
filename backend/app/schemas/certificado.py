from pydantic import BaseModel, Field
from typing import Optional, Literal
import uuid
from datetime import datetime


class CertificadoBase(BaseModel):
    inscripcion_curso_id: uuid.UUID = Field(..., description="ID de la inscripción asociada")
    folio: Optional[str] = Field(None, max_length=50, description="Folio único del certificado")
    hash_verificacion: Optional[str] = Field(None, max_length=128, description="Hash de verificación del certificado")
    s3_key: Optional[str] = Field(None, max_length=500, description="Clave S3 donde se almacena el PDF del certificado")


class CertificadoCreate(BaseModel):
    """Schema para crear un certificado"""
    inscripcion_id: uuid.UUID = Field(..., description="ID de la inscripción acreditada para la cual se genera el certificado")


class CertificadoResponse(CertificadoBase):
    id: uuid.UUID
    emitido_en: Optional[datetime]
    valido: bool
    creado_en: Optional[datetime]
    actualizado_en: Optional[datetime]
    estado: Literal["PROCESSING", "COMPLETED"] = Field(..., description="Estado de generación del certificado")
    download_url: Optional[str] = Field(None, description="URL temporal de descarga (solo si estado es COMPLETED)")

    class Config:
        from_attributes = True
