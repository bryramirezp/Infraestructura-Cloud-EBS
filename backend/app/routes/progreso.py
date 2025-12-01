import logging
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
<<<<<<< HEAD
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
=======
from app.schemas.progress import (
	ProgressResponse,
	ProgressModuloResponse,
	ProgressGeneralResponse,
	ProgressComparisonResponse,
)
from app.services.progreso_service import ProgresoService
from app.services.usuario_service import UsuarioService
from app.services.metrics_service import MetricsService
from app.utils.jwt_auth import get_current_user
from app.utils.exceptions import AuthorizationError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/progreso", tags=["Progreso"])


@router.get(
	"",
	response_model=ProgressGeneralResponse,
	status_code=status.HTTP_200_OK,
)
async def get_progreso_general(
	db: AsyncSession = Depends(get_db),
	token_payload: dict = Depends(get_current_user),
):
	"""Obtener progreso general del usuario autenticado."""
	service = ProgresoService(db)
	usuario_service = UsuarioService(db)
	
	usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
	if not usuario:
		raise AuthorizationError("Usuario no encontrado")
	
	progreso = await service.get_progreso_general(usuario.id)
	return progreso


@router.get(
	"/cursos/{curso_id}",
	response_model=ProgressResponse,
	status_code=status.HTTP_200_OK,
)
async def get_progreso_curso(
	curso_id: UUID,
	db: AsyncSession = Depends(get_db),
	token_payload: dict = Depends(get_current_user),
):
	"""Obtener progreso en un curso específico."""
	service = ProgresoService(db)
	usuario_service = UsuarioService(db)
	
	usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
	if not usuario:
		raise AuthorizationError("Usuario no encontrado")
	
	progreso = await service.get_progreso_curso(usuario.id, curso_id)
	return progreso


@router.get(
	"/modulos/{modulo_id}",
	response_model=ProgressModuloResponse,
	status_code=status.HTTP_200_OK,
)
async def get_progreso_modulo(
	modulo_id: UUID,
	db: AsyncSession = Depends(get_db),
	token_payload: dict = Depends(get_current_user),
):
	"""Obtener progreso en un módulo completo."""
	service = ProgresoService(db)
	usuario_service = UsuarioService(db)
	
	usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
	if not usuario:
		raise AuthorizationError("Usuario no encontrado")
	
	progreso = await service.get_progreso_modulo(usuario.id, modulo_id)
	return progreso


@router.get(
	"/cursos/{curso_id}/comparacion",
	response_model=ProgressComparisonResponse,
	status_code=status.HTTP_200_OK,
)
async def get_comparacion_progreso(
	curso_id: UUID,
	db: AsyncSession = Depends(get_db),
	token_payload: dict = Depends(get_current_user),
):
	"""Comparar progreso con otros estudiantes del mismo curso."""
	service = ProgresoService(db)
	usuario_service = UsuarioService(db)
	
	usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
	if not usuario:
		raise AuthorizationError("Usuario no encontrado")
	
	comparacion = await service.get_comparacion_progreso(usuario.id, curso_id)
	return comparacion


@router.get(
	"/cursos/{curso_id}/metricas",
	status_code=status.HTTP_200_OK,
)
async def get_metricas_curso(
	curso_id: UUID,
	db: AsyncSession = Depends(get_db),
	token_payload: dict = Depends(get_current_user),
):
	"""
	Obtener métricas comparativas en tiempo real usando SQL window functions.
	
	Incluye:
	- Ranking del estudiante en el curso
	- Percentil del estudiante
	- Promedio de progreso del curso
	- Máximo y mínimo de progreso
	- Métricas de puntajes
	"""
	metrics_service = MetricsService(db)
	usuario_service = UsuarioService(db)
	
	usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
	if not usuario:
		raise AuthorizationError("Usuario no encontrado")
	
	curso_metrics = await metrics_service.get_curso_metrics(curso_id, usuario.id)
	puntaje_metrics = await metrics_service.get_puntaje_metrics(curso_id, usuario.id)
	
	return {
		"curso_id": str(curso_id),
		"usuario_id": str(usuario.id),
		"progreso": curso_metrics,
		"puntajes": puntaje_metrics
	}


@router.get(
	"/metricas-generales",
	status_code=status.HTTP_200_OK,
)
async def get_metricas_generales(
	db: AsyncSession = Depends(get_db),
	token_payload: dict = Depends(get_current_user),
):
	"""
	Obtener métricas generales comparativas del usuario.
	
	Compara al usuario con todos los estudiantes de la plataforma.
	"""
	metrics_service = MetricsService(db)
	usuario_service = UsuarioService(db)
	
	usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
	if not usuario:
		raise AuthorizationError("Usuario no encontrado")
	
	general_metrics = await metrics_service.get_general_metrics(usuario.id)
	
	return {
		"usuario_id": str(usuario.id),
		"metricas": general_metrics
	}

>>>>>>> 50bb6094d50d71301466789ca430ba62ffdca6f9
