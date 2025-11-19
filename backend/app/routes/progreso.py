import logging
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.schemas.progress import (
	ProgressResponse,
	ProgressModuloResponse,
	ProgressGeneralResponse,
	ProgressComparisonResponse,
)
from app.services.progreso_service import ProgresoService
from app.services.usuario_service import UsuarioService
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

