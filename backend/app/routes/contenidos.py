import logging
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.schemas.leccion import (
    LeccionContenidoCreate,
    LeccionContenidoResponse,
    LeccionContenidoUpdate,
)
from app.services.leccion_service import LeccionService
from app.utils.roles import UserRole, require_role

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/contenidos", tags=["Contenidos"])


@router.post("", response_model=LeccionContenidoResponse, status_code=status.HTTP_201_CREATED)
async def create_contenido(
    payload: LeccionContenidoCreate,
    _: dict = Depends(require_role([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Agregar contenido a una lección (solo administradores)."""
    service = LeccionService(db)
    contenido = await service.add_contenido(payload.dict())
    return contenido


@router.put("/{contenido_id}", response_model=LeccionContenidoResponse, status_code=status.HTTP_200_OK)
async def update_contenido(
    contenido_id: UUID,
    payload: LeccionContenidoUpdate,
    _: dict = Depends(require_role([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Actualizar contenido existente (solo administradores)."""
    service = LeccionService(db)
    contenido = await service.get_contenido(contenido_id)
    updated = await service.update_contenido(contenido, payload.dict(exclude_unset=True))
    return updated


@router.delete("/{contenido_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contenido(
    contenido_id: UUID,
    _: dict = Depends(require_role([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Eliminar contenido (solo administradores)."""
    service = LeccionService(db)
    contenido = await service.get_contenido(contenido_id)
    await service.delete_contenido(contenido)
