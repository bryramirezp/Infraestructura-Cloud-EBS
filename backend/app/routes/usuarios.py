from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.schemas.usuario import UsuarioResponse, UsuarioUpdate
from app.services.usuario_service import UsuarioService
from app.utils.jwt_auth import get_current_user
from app.utils.roles import UserRole, require_any_role, require_role

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.get("/me", response_model=UsuarioResponse, status_code=status.HTTP_200_OK)
async def get_profile(
	token_payload: dict = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	"""
	Obtener perfil del usuario autenticado.
	
	- **Permisos**: Requiere autenticación
	- **Respuesta**: Datos del perfil del usuario autenticado
	"""
	service = UsuarioService(db)
	usuario = await service.get_by_cognito_id(token_payload.get("sub"))
	return usuario


@router.put("/me", response_model=UsuarioResponse, status_code=status.HTTP_200_OK)
async def update_profile(
	payload: UsuarioUpdate,
	token_payload: dict = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	"""
	Actualizar perfil del usuario autenticado.
	
	- **Permisos**: Requiere autenticación
	- **Parámetros**: Datos a actualizar (nombre, apellido, avatar_url)
	- **Respuesta**: Perfil actualizado del usuario
	"""
	service = UsuarioService(db)
	usuario = await service.get_by_cognito_id(token_payload.get("sub"))
	updated = await service.update_profile(usuario, payload.dict(exclude_unset=True))
	return updated


@router.get("/{usuario_id}", response_model=UsuarioResponse, status_code=status.HTTP_200_OK)
async def get_usuario_by_id(
	usuario_id: UUID,
	_: dict = Depends(require_any_role(UserRole.ADMIN, UserRole.COORDINATOR)),
	db: AsyncSession = Depends(get_db),
):
	"""
	Obtener usuario por ID.
	
	- **Permisos**: Requiere rol de administrador o coordinador
	- **Parámetros**: `usuario_id` - ID del usuario a obtener
	- **Respuesta**: Datos del usuario solicitado
	"""
	service = UsuarioService(db)
	usuario = await service.get_by_id(usuario_id)
	return usuario


@router.get("", response_model=List[UsuarioResponse], status_code=status.HTTP_200_OK)
async def list_usuarios(
	_: dict = Depends(require_role([UserRole.ADMIN])),
	db: AsyncSession = Depends(get_db),
	skip: int = Query(0, ge=0, description="Número de registros a omitir"),
	limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar"),
):
	"""
	Listar usuarios con paginación.
	
	- **Permisos**: Requiere rol de administrador
	- **Paginación**: Usa skip/limit para paginación
	- **Respuesta**: Lista paginada de usuarios
	"""
	service = UsuarioService(db)
	usuarios = await service.list(limit=limit, offset=skip)
	return usuarios
