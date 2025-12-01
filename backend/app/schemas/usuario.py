from pydantic import BaseModel, EmailStr, Field
from typing import Optional
import uuid
from datetime import datetime


class UsuarioBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100, description="Nombre del usuario")
    apellido: str = Field(..., min_length=1, max_length=100, description="Apellido del usuario")
    email: EmailStr = Field(..., description="Email del usuario")
    avatar_url: Optional[str] = Field(None, max_length=500, description="URL del avatar")


class UsuarioCreate(UsuarioBase):
    # No password stored here (Cognito manages auth)
    pass


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100, description="Nombre del usuario")
    apellido: Optional[str] = Field(None, min_length=1, max_length=100, description="Apellido del usuario")
    avatar_url: Optional[str] = Field(None, max_length=500, description="URL del avatar")


class UsuarioResponse(UsuarioBase):
    id: uuid.UUID
    creado_en: Optional[datetime]
    actualizado_en: Optional[datetime]

    class Config:
        from_attributes = True
