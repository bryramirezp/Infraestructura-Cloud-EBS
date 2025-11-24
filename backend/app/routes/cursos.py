import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.schemas.curso import CursoCreate, CursoDetailResponse, CursoResponse, CursoUpdate
from app.schemas.guia_estudio import GuiaEstudioResponse
from app.schemas.modulo import ModuloResponse
from app.services.curso_service import CursoService
from app.schemas.examen_final import ExamenFinalDetailResponse
from app.utils.roles import UserRole, require_role

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cursos", tags=["Cursos"])


@router.get("", response_model=List[CursoResponse], status_code=status.HTTP_200_OK)
async def list_cursos(
	db: AsyncSession = Depends(get_db),
	publicado: Optional[bool] = Query(None, description="Filtrar por estado publicado"),
	modulo_id: Optional[UUID] = Query(None, description="Filtrar por módulo"),
	skip: int = Query(0, ge=0, description="Número de registros a omitir"),
	limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar"),
):
	"""
	Listar cursos (materias) disponibles, con filtros opcionales.

	- **Permisos**: Abierto para todos los usuarios.
	- **Parámetros**:
	  - `publicado`: Filtra cursos por estado de publicación.
	  - `modulo_id`: Filtra cursos por módulo.
	  - `skip`: Número de cursos a omitir para paginación.
	  - `limit`: Número máximo de cursos a retornar para paginación.
	- **Respuesta**: Lista paginada de cursos.
	"""
	service = CursoService(db)
	cursos = await service.list_cursos(publicado=publicado, modulo_id=modulo_id, skip=skip, limit=limit)
	return cursos


@router.get("/{curso_id}", response_model=CursoDetailResponse, status_code=status.HTTP_200_OK)
async def get_curso(
	curso_id: UUID,
	db: AsyncSession = Depends(get_db),
):
	"""Obtener curso con detalles completos (guías de estudio, examen final)."""
	service = CursoService(db)
	curso = await service.get_curso_with_relations(curso_id)
	
	guias_response = [
		GuiaEstudioResponse.from_orm(guia) for guia in curso.guias_estudio if guia.activo
	]
	
	return CursoDetailResponse(
		id=curso.id,
		titulo=curso.titulo,
		descripcion=curso.descripcion,
		publicado=curso.publicado,
		creado_en=curso.creado_en,
		actualizado_en=curso.actualizado_en,
		examen_final_id=curso.examen_final.id if curso.examen_final else None,
		guias_estudio=guias_response,
	)


@router.get("/{curso_id}/guias-estudio", response_model=List[GuiaEstudioResponse], status_code=status.HTTP_200_OK)
async def get_guias_estudio(
	curso_id: UUID,
	db: AsyncSession = Depends(get_db),
	activo: Optional[bool] = Query(True, description="Filtrar solo guías activas"),
):
	"""Obtener guías de estudio de un curso, con URLs prefirmadas si están en S3."""
	service = CursoService(db)
	
	guias_response = await service.get_guias_estudio_con_urls(curso_id, activo=activo)
	
	return guias_response


@router.get("/{curso_id}/examen-final", response_model=ExamenFinalDetailResponse, status_code=status.HTTP_200_OK)
async def get_examen_final_curso(
	curso_id: UUID,
	db: AsyncSession = Depends(get_db),
):
	"""Obtener examen final de un curso."""
	service = CursoService(db)
	return await service.get_examen_final_con_conteo(curso_id)


@router.get("/{curso_id}/modulos", response_model=List[ModuloResponse], status_code=status.HTTP_200_OK)
async def list_modulos_by_curso(
	curso_id: UUID,
	db: AsyncSession = Depends(get_db),
):
	"""
	Listar módulos asociados a un curso.
	
	- **Permisos**: Endpoint público (no requiere autenticación)
	- **Parámetros**: `curso_id` - ID del curso
	- **Respuesta**: Lista de módulos asociados al curso, ordenados por slot
	"""
	service = CursoService(db)
	modulos = await service.list_modulos_by_curso(curso_id)
	return [ModuloResponse.from_orm(modulo) for modulo in modulos]


@router.post("", response_model=CursoResponse, status_code=status.HTTP_201_CREATED)
async def create_curso(
	payload: CursoCreate,
	_: dict = Depends(require_role([UserRole.ADMIN])),
	db: AsyncSession = Depends(get_db),
):
	"""Crear un nuevo curso (materia) - solo administradores."""
	service = CursoService(db)
	curso = await service.create_curso(payload.dict())
	return curso


@router.put("/{curso_id}", response_model=CursoResponse, status_code=status.HTTP_200_OK)
async def update_curso(
	curso_id: UUID,
	payload: CursoUpdate,
	_: dict = Depends(require_role([UserRole.ADMIN])),
	db: AsyncSession = Depends(get_db),
):
	"""Actualizar un curso existente - solo administradores."""
	service = CursoService(db)
	curso = await service.get_curso(curso_id)
	updated = await service.update_curso(curso, payload.dict(exclude_unset=True))
	return updated

