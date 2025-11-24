"""
Helpers para queries comunes y patrones reutilizables.

Estos helpers centralizan lógica común de acceso a datos para evitar duplicación
y asegurar consistencia en el manejo de errores.
"""

import uuid
from typing import Optional, TypeVar, Type
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.utils.exceptions import NotFoundError

T = TypeVar("T")


async def get_or_404(
    db: AsyncSession,
    model: Type[T],
    resource_id: uuid.UUID,
    resource_name: str = "Resource"
) -> T:
    """
    Obtener un recurso por ID o lanzar NotFoundError si no existe.
    
    Args:
        db: Sesión de base de datos
        model: Modelo SQLAlchemy
        resource_id: ID del recurso a buscar
        resource_name: Nombre del recurso para el mensaje de error
    
    Returns:
        Instancia del modelo encontrada
    
    Raises:
        NotFoundError: Si el recurso no existe
    """
    stmt = select(model).where(model.id == resource_id)
    result = await db.execute(stmt)
    resource = result.scalar_one_or_none()
    
    if not resource:
        raise NotFoundError(resource_name, str(resource_id))
    
    return resource


async def get_optional(
    db: AsyncSession,
    model: Type[T],
    resource_id: uuid.UUID
) -> Optional[T]:
    """
    Obtener un recurso por ID o retornar None si no existe.
    
    Args:
        db: Sesión de base de datos
        model: Modelo SQLAlchemy
        resource_id: ID del recurso a buscar
    
    Returns:
        Instancia del modelo o None si no existe
    """
    stmt = select(model).where(model.id == resource_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

