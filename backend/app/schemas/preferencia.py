from pydantic import BaseModel, Field
from typing import Optional
import uuid
from datetime import datetime


class PreferenciaNotificacionBase(BaseModel):
    usuario_id: uuid.UUID = Field(..., description="ID del usuario propietario de las preferencias")
    email_recordatorios: Optional[bool] = Field(None, description="Indica si el usuario desea recibir emails de recordatorios")
    email_motivacion: Optional[bool] = Field(None, description="Indica si el usuario desea recibir emails de motivación")
    email_resultados: Optional[bool] = Field(None, description="Indica si el usuario desea recibir emails con resultados")


class PreferenciaNotificacionCreate(BaseModel):
    email_recordatorios: Optional[bool] = Field(None, description="Indica si el usuario desea recibir emails de recordatorios")
    email_motivacion: Optional[bool] = Field(None, description="Indica si el usuario desea recibir emails de motivación")
    email_resultados: Optional[bool] = Field(None, description="Indica si el usuario desea recibir emails con resultados")


class PreferenciaNotificacionUpdate(BaseModel):
    email_recordatorios: Optional[bool] = Field(None, description="Indica si el usuario desea recibir emails de recordatorios")
    email_motivacion: Optional[bool] = Field(None, description="Indica si el usuario desea recibir emails de motivación")
    email_resultados: Optional[bool] = Field(None, description="Indica si el usuario desea recibir emails con resultados")


class PreferenciaNotificacionResponse(PreferenciaNotificacionBase):
    id: uuid.UUID
    actualizado_en: Optional[datetime]

    class Config:
        from_attributes = True
