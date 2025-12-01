import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.schemas.inscripcion import (
    InscripcionCursoCreate,
    InscripcionCursoResponse,
)
from app.services.inscripcion_service import InscripcionService
from app.utils.roles import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Inscripciones"])


@router.post("/cursos/{curso_id}/inscribir", response_model=InscripcionCursoResponse, status_code=status.HTTP_201_CREATED)
async def inscribir_usuario(
    curso_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Inscribir al usuario actual en un curso."""
    service = InscripcionService(db)
    usuario_id = UUID(current_user["id"])
    inscripcion = await service.inscribir_usuario(usuario_id, curso_id)
    return inscripcion


@router.get("/mis-cursos", response_model=List[InscripcionCursoResponse], status_code=status.HTTP_200_OK)
async def list_mis_cursos(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Listar cursos donde el usuario actual está inscrito."""
    service = InscripcionService(db)
    usuario_id = UUID(current_user["id"])
    inscripciones = await service.list_mis_cursos(usuario_id)
    return inscripciones
