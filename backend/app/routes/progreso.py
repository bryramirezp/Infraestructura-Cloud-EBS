import logging
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.services.progreso_service import ProgresoService
from app.utils.roles import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Progreso"])


@router.post("/lecciones/{leccion_id}/completar", status_code=status.HTTP_200_OK)
async def completar_leccion(
    leccion_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Marcar una lección como completada."""
    service = ProgresoService(db)
    usuario_id = UUID(current_user["id"])
    await service.marcar_leccion_completa(usuario_id, leccion_id)
    return {"message": "Lección marcada como completada"}


@router.get("/cursos/{curso_id}/progreso", status_code=status.HTTP_200_OK)
async def get_progreso_curso(
    curso_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Obtener progreso del usuario en un curso."""
    service = ProgresoService(db)
    usuario_id = UUID(current_user["id"])
    progreso = await service.get_progreso_curso(usuario_id, curso_id)
    # Retornar datos crudos por ahora, idealmente usar un schema
    return progreso
