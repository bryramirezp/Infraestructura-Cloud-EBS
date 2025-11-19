from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime


class PreferenciaNotificacionBase(BaseModel):
    usuario_id: uuid.UUID
    email_recordatorios: Optional[bool] = None
    email_motivacion: Optional[bool] = None
    email_resultados: Optional[bool] = None


class PreferenciaNotificacionCreate(BaseModel):
    email_recordatorios: Optional[bool] = None
    email_motivacion: Optional[bool] = None
    email_resultados: Optional[bool] = None


class PreferenciaNotificacionUpdate(BaseModel):
    email_recordatorios: Optional[bool] = None
    email_motivacion: Optional[bool] = None
    email_resultados: Optional[bool] = None


class PreferenciaNotificacionResponse(PreferenciaNotificacionBase):
    id: uuid.UUID
    actualizado_en: Optional[datetime]

    class Config:
        from_attributes = True
