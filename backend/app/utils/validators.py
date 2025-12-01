"""
Validaciones reutilizables y helpers de acceso a datos.

Centraliza lógica común de validación y acceso a recursos relacionados con usuarios.
"""

import uuid
from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.usuario_service import UsuarioService
from app.utils.roles import is_admin as check_is_admin


async def get_user_info(
    db: AsyncSession,
    token_payload: Optional[dict]
) -> Tuple[Optional[uuid.UUID], bool]:
    """
    Extraer información de usuario desde el token payload.
    
    Args:
        db: Sesión de base de datos
        token_payload: Payload del token JWT (puede ser None)
    
    Returns:
        Tupla (usuario_id, is_admin):
        - usuario_id: UUID del usuario o None si no está autenticado
        - is_admin: True si es admin, False en caso contrario
    """
    if not token_payload:
        return None, False
    
    cognito_id = token_payload.get("sub")
    if not cognito_id:
        return None, False
    
    try:
        usuario_service = UsuarioService(db)
        usuario = await usuario_service.get_by_cognito_id(cognito_id)
        admin = check_is_admin(token_payload)
        return usuario.id, admin
    except Exception:
        return None, False

