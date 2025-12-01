import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.schemas.foro import (
	ForoComentarioCreate,
	ForoComentarioResponse,
	ForoComentarioUpdate,
)
from app.services.foro_service import ForoService
from app.services.usuario_service import UsuarioService
from app.utils.jwt_auth import get_current_user
from app.utils.roles import is_admin
from app.utils.exceptions import AuthorizationError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/foro", tags=["Foro"])


@router.get(
	"/cursos/{curso_id}/lecciones/{leccion_id}/comentarios",
	response_model=List[ForoComentarioResponse],
	status_code=status.HTTP_200_OK,
)
async def list_comentarios(
	curso_id: UUID,
	leccion_id: UUID,
	db: AsyncSession = Depends(get_db),
	token_payload: dict = Depends(get_current_user),
	skip: int = Query(0, ge=0, description="Número de registros a omitir"),
	limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar"),
):
	"""
	Listar comentarios de una lección específica.

	- **Permisos**: Requiere autenticación.
	- **Parámetros**:
	  - `curso_id`: ID del curso.
	  - `leccion_id`: ID de la lección.
	  - `skip`: Número de comentarios a omitir para paginación.
	  - `limit`: Número máximo de comentarios a retornar para paginación.
	- **Respuesta**: Lista paginada de comentarios del foro.
	"""
	service = ForoService(db)
	usuario_service = UsuarioService(db)
	
	usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
	if not usuario:
		raise AuthorizationError("Usuario no encontrado")
	
	comentarios = await service.list_comentarios_by_leccion(curso_id, leccion_id, skip=skip, limit=limit)
	return [ForoComentarioResponse.from_orm(comentario) for comentario in comentarios]


@router.post(
	"/cursos/{curso_id}/lecciones/{leccion_id}/comentarios",
	response_model=ForoComentarioResponse,
	status_code=status.HTTP_201_CREATED,
)
async def create_comentario(
	curso_id: UUID,
	leccion_id: UUID,
	payload: ForoComentarioCreate,
	db: AsyncSession = Depends(get_db),
	token_payload: dict = Depends(get_current_user),
):
	"""
	Crear un nuevo comentario en el foro.
	
	- **Permisos**: Requiere autenticación
	- **Parámetros**: `curso_id` - ID del curso, `leccion_id` - ID de la lección, contenido del comentario
	- **Respuesta**: Comentario creado
	"""
	service = ForoService(db)
	usuario_service = UsuarioService(db)
	
	usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
	if not usuario:
		raise AuthorizationError("Usuario no encontrado")
	
	if payload.curso_id != curso_id or payload.leccion_id != leccion_id:
		from app.utils.exceptions import ValidationError
		raise ValidationError("Los IDs en la URL y el payload deben coincidir")
	
	comentario = await service.create_comentario(
		usuario_id=usuario.id,
		curso_id=curso_id,
		leccion_id=leccion_id,
		contenido=payload.contenido,
	)
	
	return ForoComentarioResponse.from_orm(comentario)


@router.put(
	"/comentarios/{comentario_id}",
	response_model=ForoComentarioResponse,
	status_code=status.HTTP_200_OK,
)
async def update_comentario(
	comentario_id: UUID,
	payload: ForoComentarioUpdate,
	db: AsyncSession = Depends(get_db),
	token_payload: dict = Depends(get_current_user),
):
	"""
	Actualizar un comentario propio.
	
	- **Permisos**: Requiere autenticación. Solo el autor puede actualizar su comentario
	- **Parámetros**: `comentario_id` - ID del comentario, nuevo contenido
	- **Respuesta**: Comentario actualizado
	"""
	service = ForoService(db)
	usuario_service = UsuarioService(db)
	
	usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
	if not usuario:
		raise AuthorizationError("Usuario no encontrado")
	
	comentario = await service.update_comentario(
		comentario_id=comentario_id,
		usuario_id=usuario.id,
		contenido=payload.contenido,
	)
	
	return ForoComentarioResponse.from_orm(comentario)


@router.delete(
	"/comentarios/{comentario_id}",
	status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_comentario(
	comentario_id: UUID,
	db: AsyncSession = Depends(get_db),
	token_payload: dict = Depends(get_current_user),
):
	"""
	Eliminar un comentario propio.
	
	- **Permisos**: Requiere autenticación. Solo el autor o un administrador puede eliminar
	- **Parámetros**: `comentario_id` - ID del comentario
	- **Respuesta**: No content (204)
	"""
	service = ForoService(db)
	usuario_service = UsuarioService(db)
	
	usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
	if not usuario:
		raise AuthorizationError("Usuario no encontrado")
	
	admin = is_admin(token_payload)
	
	await service.delete_comentario(
		comentario_id=comentario_id,
		usuario_id=usuario.id,
		is_admin=admin,
	)
	
	return None
