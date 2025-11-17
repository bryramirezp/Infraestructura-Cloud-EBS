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
	"""Obtener perfil del usuario autenticado."""
	service = UsuarioService(db)
	usuario = await service.get_by_cognito_id(token_payload.get("sub"))
	return usuario


@router.get("/perfil", response_model=UsuarioResponse, status_code=status.HTTP_200_OK)
async def get_perfil(
	token_payload: dict = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	"""Obtener perfil del usuario autenticado (alias para compatibilidad con frontend)."""
	service = UsuarioService(db)
	usuario = await service.get_by_cognito_id(token_payload.get("sub"))
	return usuario


@router.put("/me", response_model=UsuarioResponse, status_code=status.HTTP_200_OK)
async def update_profile(
	payload: UsuarioUpdate,
	token_payload: dict = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	"""Actualizar perfil del usuario autenticado."""
	service = UsuarioService(db)
	usuario = await service.get_by_cognito_id(token_payload.get("sub"))
	updated = await service.update_profile(usuario, payload.dict(exclude_unset=True))
	return updated


@router.put("/perfil", response_model=UsuarioResponse, status_code=status.HTTP_200_OK)
async def update_perfil(
	payload: UsuarioUpdate,
	token_payload: dict = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	"""Actualizar perfil del usuario autenticado (alias para compatibilidad con frontend)."""
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
	"""Obtener usuario por ID (solo administradores o coordinadores)."""
	service = UsuarioService(db)
	usuario = await service.get_by_id(usuario_id)
	return usuario


@router.get("", response_model=List[UsuarioResponse], status_code=status.HTTP_200_OK)
async def list_usuarios(
	_: dict = Depends(require_role([UserRole.ADMIN])),
	db: AsyncSession = Depends(get_db),
	limit: int = Query(100, ge=1, le=200),
	offset: int = Query(0, ge=0),
):
	"""Listar usuarios (solo administradores)."""
	service = UsuarioService(db)
	usuarios = await service.list(limit=limit, offset=offset)
	return usuarios
