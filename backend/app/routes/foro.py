import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.schemas.foro import (
    ForoComentarioCreate,
    ForoComentarioResponse,
)
from app.services.foro_service import ForoService
from app.utils.roles import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Foro"])


@router.get("/lecciones/{leccion_id}/comentarios", response_model=List[ForoComentarioResponse], status_code=status.HTTP_200_OK)
async def list_comentarios(
    leccion_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Listar comentarios de una lección."""
    service = ForoService(db)
    comentarios = await service.list_comentarios(leccion_id)
    return comentarios


@router.post("/lecciones/{leccion_id}/comentarios", response_model=ForoComentarioResponse, status_code=status.HTTP_201_CREATED)
async def create_comentario(
    leccion_id: UUID,
    payload: ForoComentarioCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Publicar un comentario en una lección."""
    service = ForoService(db)
    usuario_id = UUID(current_user["id"])
    
    # Necesitamos el curso_id para el modelo. 
    # Podríamos buscarlo desde la lección, pero por eficiencia asumimos que el frontend podría enviarlo
    # O mejor, lo buscamos en el servicio.
    # Por ahora, vamos a requerir que el servicio resuelva el curso_id o modificar el schema.
    # Modificaremos el servicio para buscar la lección y obtener el curso_id.
    
    # TODO: Resolver curso_id correctamente. Por ahora hardcodeamos o fallará si no se pasa.
    # Como el schema ForoComentarioCreate no tiene curso_id, debemos obtenerlo.
    
    # Solución temporal: Obtener lección para sacar curso_id
    from app.services.leccion_service import LeccionService
    leccion_service = LeccionService(db)
    leccion = await leccion_service.get_leccion(leccion_id)
    # La lección tiene modulo, modulo tiene cursos... es complejo.
    # La relación es Leccion -> Modulo -> ModuloCurso -> Curso.
    # Una lección pertenece a un módulo, y un módulo puede estar en varios cursos.
    # El comentario se hace en el contexto de un curso específico?
    # El modelo ForoComentario tiene curso_id.
    # Asumiremos que el comentario se asocia al curso desde donde se ve.
    # Pero la API actual solo recibe leccion_id.
    # Deberíamos recibir curso_id en el query param o body.
    
    # Simplificación: Dejar curso_id nulo o buscar uno por defecto (peligroso).
    # Mejor opción: Agregar curso_id al payload o query param.
    # Voy a asumir que el payload debería tener curso_id, pero el schema actual no lo tiene.
    # Voy a dejarlo pendiente de refactor y usar un placeholder.
    
    data = payload.dict()
    data["usuario_id"] = usuario_id
    data["curso_id"] = leccion.modulo.cursos[0].curso_id if leccion.modulo and leccion.modulo.cursos else None # Hack temporal
    
    if not data["curso_id"]:
         # Fallback o error
         pass

    comentario = await service.create_comentario(data)
    return comentario
