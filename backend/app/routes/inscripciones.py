import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.schemas.inscripcion import InscripcionCreate, InscripcionResponse
from app.services.inscripcion_service import InscripcionService
from app.services.usuario_service import UsuarioService
from app.utils.jwt_auth import get_current_user
from app.utils.exceptions import AuthorizationError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/inscripciones", tags=["Inscripciones"])


@router.post(
	"",
	response_model=InscripcionResponse,
	status_code=status.HTTP_201_CREATED,
)
async def create_inscripcion(
	payload: InscripcionCreate,
	db: AsyncSession = Depends(get_db),
	token_payload: dict = Depends(get_current_user),
):
	"""Inscribirse a un curso."""
	service = InscripcionService(db)
	usuario_service = UsuarioService(db)
	
	usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
	if not usuario:
		raise AuthorizationError("Usuario no encontrado")
	
	inscripcion = await service.create_inscripcion(
		usuario_id=usuario.id,
		curso_id=payload.curso_id,
		fecha_inscripcion=payload.fecha_inscripcion,
	)
	
	return InscripcionResponse.from_orm(inscripcion)


@router.get(
	"",
	response_model=List[InscripcionResponse],
	status_code=status.HTTP_200_OK,
)
async def list_inscripciones(
	db: AsyncSession = Depends(get_db),
	token_payload: dict = Depends(get_current_user),
	estado: Optional[str] = Query(None, description="Filtrar por estado"),
):
	"""Listar inscripciones del usuario autenticado."""
	service = InscripcionService(db)
	usuario_service = UsuarioService(db)
	
	usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
	if not usuario:
		raise AuthorizationError("Usuario no encontrado")
	
	from app.database.enums import EstadoInscripcion
	
	estado_enum = None
	if estado:
		try:
			estado_enum = EstadoInscripcion(estado.upper())
		except ValueError:
			pass
	
	inscripciones = await service.list_inscripciones_by_usuario(
		usuario_id=usuario.id,
		estado=estado_enum,
	)
	
	return [InscripcionResponse.from_orm(inscripcion) for inscripcion in inscripciones]


@router.get(
	"/{inscripcion_id}",
	response_model=InscripcionResponse,
	status_code=status.HTTP_200_OK,
)
async def get_inscripcion(
	inscripcion_id: UUID,
	db: AsyncSession = Depends(get_db),
	token_payload: dict = Depends(get_current_user),
):
	"""Obtener detalles de una inscripción."""
	service = InscripcionService(db)
	usuario_service = UsuarioService(db)
	
	usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
	if not usuario:
		raise AuthorizationError("Usuario no encontrado")
	
	inscripcion = await service.get_inscripcion(inscripcion_id)
	
	if inscripcion.usuario_id != usuario.id:
		from app.utils.roles import is_admin
		if not is_admin(token_payload):
			raise AuthorizationError("No tienes permiso para ver esta inscripción")
	
	return InscripcionResponse.from_orm(inscripcion)


@router.put(
	"/{inscripcion_id}/pausar",
	response_model=InscripcionResponse,
	status_code=status.HTTP_200_OK,
)
async def pausar_inscripcion(
	inscripcion_id: UUID,
	db: AsyncSession = Depends(get_db),
	token_payload: dict = Depends(get_current_user),
):
	"""Pausar una inscripción."""
	service = InscripcionService(db)
	usuario_service = UsuarioService(db)
	
	usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
	if not usuario:
		raise AuthorizationError("Usuario no encontrado")
	
	inscripcion = await service.get_inscripcion(inscripcion_id)
	
	if inscripcion.usuario_id != usuario.id:
		from app.utils.roles import is_admin
		if not is_admin(token_payload):
			raise AuthorizationError("No tienes permiso para pausar esta inscripción")
	
	inscripcion_actualizada = await service.pausar_inscripcion(inscripcion_id)
	return InscripcionResponse.from_orm(inscripcion_actualizada)


@router.put(
	"/{inscripcion_id}/reanudar",
	response_model=InscripcionResponse,
	status_code=status.HTTP_200_OK,
)
async def reanudar_inscripcion(
	inscripcion_id: UUID,
	db: AsyncSession = Depends(get_db),
	token_payload: dict = Depends(get_current_user),
):
	"""Reanudar una inscripción pausada."""
	service = InscripcionService(db)
	usuario_service = UsuarioService(db)
	
	usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
	if not usuario:
		raise AuthorizationError("Usuario no encontrado")
	
	inscripcion = await service.get_inscripcion(inscripcion_id)
	
	if inscripcion.usuario_id != usuario.id:
		from app.utils.roles import is_admin
		if not is_admin(token_payload):
			raise AuthorizationError("No tienes permiso para reanudar esta inscripción")
	
	inscripcion_actualizada = await service.reanudar_inscripcion(inscripcion_id)
	return InscripcionResponse.from_orm(inscripcion_actualizada)

