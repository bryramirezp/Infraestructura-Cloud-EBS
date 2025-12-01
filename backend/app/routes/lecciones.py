import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.schemas.leccion import (
    LeccionCreate,
    LeccionResponse,
    LeccionUpdate,
)
from app.services.leccion_service import LeccionService
from app.utils.roles import UserRole, require_role

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/lecciones", tags=["Lecciones"])


@router.get("/{leccion_id}", response_model=LeccionResponse, status_code=status.HTTP_200_OK)
async def get_leccion(
    leccion_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Obtener detalle de una lección."""
    service = LeccionService(db)
    leccion = await service.get_leccion(leccion_id)
    return leccion


@router.post("", response_model=LeccionResponse, status_code=status.HTTP_201_CREATED)
async def create_leccion(
    payload: LeccionCreate,
    _: dict = Depends(require_role([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Crear una nueva lección (solo administradores)."""
    service = LeccionService(db)
    leccion = await service.create_leccion(payload.dict())
    return leccion


@router.put("/{leccion_id}", response_model=LeccionResponse, status_code=status.HTTP_200_OK)
async def update_leccion(
    leccion_id: UUID,
    payload: LeccionUpdate,
    _: dict = Depends(require_role([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Actualizar una lección existente (solo administradores)."""
    service = LeccionService(db)
    leccion = await service.get_leccion(leccion_id)
    updated = await service.update_leccion(leccion, payload.dict(exclude_unset=True))
    return updated


@router.delete("/{leccion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_leccion(
    leccion_id: UUID,
    _: dict = Depends(require_role([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Eliminar una lección (solo administradores)."""
    service = LeccionService(db)
    leccion = await service.get_leccion(leccion_id)
    await service.delete_leccion(leccion)
