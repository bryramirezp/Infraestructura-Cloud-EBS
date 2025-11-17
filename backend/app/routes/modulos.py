from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.schemas.curso import CursoResponse
from app.schemas.modulo import (
	ModuloCreate,
	ModuloDetailResponse,
	ModuloResponse,
	ModuloUpdate,
	ModuloCursoItem,
)
from app.services.modulo_service import ModuloService
from app.utils.roles import UserRole, require_role

router = APIRouter(prefix="/modulos", tags=["Modulos"])


@router.get("", response_model=List[ModuloResponse], status_code=status.HTTP_200_OK)
async def list_modulos(
	db: AsyncSession = Depends(get_db),
	publicado: Optional[bool] = Query(None, description="Filtrar por estado publicado"),
):
	"""Listar módulos disponibles, con filtro opcional por publicación."""
	service = ModuloService(db)
	modulos = await service.list_modulos(publicado=publicado)
	return modulos


@router.get("/{modulo_id}", response_model=ModuloDetailResponse, status_code=status.HTTP_200_OK)
async def get_modulo(
	modulo_id: UUID,
	db: AsyncSession = Depends(get_db),
):
	"""Obtener módulo y sus cursos asociados."""
	service = ModuloService(db)
	modulo = await service.get_modulo_with_cursos(modulo_id)
	cursos = sorted(modulo.cursos, key=lambda rel: rel.slot)
	curso_items = [
		ModuloCursoItem(
			curso=CursoResponse.from_orm(rel.curso),
			slot=rel.slot,
		)
		for rel in cursos
	]

	return ModuloDetailResponse(
		id=modulo.id,
		titulo=modulo.titulo,
		fecha_inicio=modulo.fecha_inicio,
		fecha_fin=modulo.fecha_fin,
		publicado=modulo.publicado,
		creado_en=modulo.creado_en,
		actualizado_en=modulo.actualizado_en,
		cursos=curso_items,
	)


@router.get("/{modulo_id}/cursos", response_model=List[CursoResponse], status_code=status.HTTP_200_OK)
async def list_cursos_by_modulo(
	modulo_id: UUID,
	db: AsyncSession = Depends(get_db),
):
	"""Listar cursos asociados a un módulo."""
	service = ModuloService(db)
	cursos = await service.list_cursos_by_modulo(modulo_id)
	return cursos


@router.post("", response_model=ModuloResponse, status_code=status.HTTP_201_CREATED)
async def create_modulo(
	payload: ModuloCreate,
	_: dict = Depends(require_role([UserRole.ADMIN])),
	db: AsyncSession = Depends(get_db),
):
	"""Crear un nuevo módulo (solo administradores)."""
	service = ModuloService(db)
	modulo = await service.create_modulo(payload.dict())
	return modulo


@router.put("/{modulo_id}", response_model=ModuloResponse, status_code=status.HTTP_200_OK)
async def update_modulo(
	modulo_id: UUID,
	payload: ModuloUpdate,
	_: dict = Depends(require_role([UserRole.ADMIN])),
	db: AsyncSession = Depends(get_db),
):
	"""Actualizar un módulo existente (solo administradores)."""
	service = ModuloService(db)
	modulo = await service.get_modulo(modulo_id)
	updated = await service.update_modulo(modulo, payload.dict(exclude_unset=True))
	return updated
