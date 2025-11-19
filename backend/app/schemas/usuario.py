from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid
from datetime import datetime


class UsuarioBase(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
    avatar_url: Optional[str] = None
    cognito_user_id: Optional[str] = None


class UsuarioCreate(UsuarioBase):
    # No password stored here (Cognito manages auth)
    pass


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    avatar_url: Optional[str] = None


class UsuarioResponse(UsuarioBase):
    id: uuid.UUID
    creado_en: Optional[datetime]
    actualizado_en: Optional[datetime]

    class Config:
        from_attributes = True
