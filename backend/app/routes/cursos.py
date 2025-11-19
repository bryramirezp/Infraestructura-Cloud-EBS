import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.schemas.curso import CursoCreate, CursoDetailResponse, CursoResponse, CursoUpdate
from app.schemas.guia_estudio import GuiaEstudioResponse
from app.services.curso_service import CursoService
from app.services.examen_final_service import ExamenFinalService
from app.schemas.examen_final import ExamenFinalDetailResponse
from app.services.s3_service import S3Service
from app.utils.roles import UserRole, require_role

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cursos", tags=["Cursos"])


@router.get("", response_model=List[CursoResponse], status_code=status.HTTP_200_OK)
async def list_cursos(
	db: AsyncSession = Depends(get_db),
	publicado: Optional[bool] = Query(None, description="Filtrar por estado publicado"),
	modulo_id: Optional[UUID] = Query(None, description="Filtrar por módulo"),
):
	"""Listar cursos (materias) disponibles, con filtros opcionales."""
	service = CursoService(db)
	cursos = await service.list_cursos(publicado=publicado, modulo_id=modulo_id)
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
	s3_service = S3Service()
	
	guias = await service.list_guias_estudio(curso_id, activo=activo)
	
	guias_response = []
	for guia in guias:
		guia_data = GuiaEstudioResponse.from_orm(guia).dict()
		
		if guia.url:
			s3_key = None
			if guia.url.startswith("s3://"):
				s3_key = guia.url.replace("s3://", "").split("/", 1)[-1] if "/" in guia.url.replace("s3://", "") else guia.url.replace("s3://", "")
			elif not guia.url.startswith("http"):
				s3_key = guia.url
			
			if s3_key:
				try:
					presigned_url = s3_service.generate_presigned_url(s3_key, expiration=3600)
					guia_data["url"] = presigned_url
				except Exception as e:
					logger.warning(f"Error generando URL prefirmada para guía {guia.id}: {e}")
		
		guias_response.append(GuiaEstudioResponse(**guia_data))
	
	return guias_response


@router.get("/{curso_id}/examen-final", response_model=ExamenFinalDetailResponse, status_code=status.HTTP_200_OK)
async def get_examen_final_curso(
	curso_id: UUID,
	db: AsyncSession = Depends(get_db),
):
	"""Obtener examen final de un curso."""
	examen_service = ExamenFinalService(db)
	examen = await examen_service.get_examen_final_by_curso(curso_id)
	if not examen:
		from app.utils.exceptions import NotFoundError
		raise NotFoundError("Examen final", f"para curso {curso_id}")
	
	from sqlalchemy import select
	from app.database import models
	
	stmt = select(models.Pregunta).where(models.Pregunta.examen_final_id == examen.id)
	result = await db.execute(stmt)
	preguntas = result.scalars().all()
	
	return ExamenFinalDetailResponse(
		id=examen.id,
		curso_id=examen.curso_id,
		titulo=examen.titulo,
		publicado=examen.publicado,
		aleatorio=examen.aleatorio,
		guarda_calificacion=examen.guarda_calificacion,
		creado_en=examen.creado_en,
		actualizado_en=examen.actualizado_en,
		numero_preguntas=len(preguntas),
	)


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

