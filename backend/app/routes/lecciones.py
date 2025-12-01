import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.schemas.leccion import (
	LeccionCreate,
	LeccionDetailResponse,
	LeccionResponse,
	LeccionUpdate,
	LeccionContenidoResponse,
)
from app.schemas.quiz import QuizDetailResponse
from app.services.leccion_service import LeccionService
from app.utils.jwt_auth import get_current_user
from app.utils.roles import UserRole, require_role, is_admin
from app.database import models
from sqlalchemy import select

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/lecciones", tags=["Lecciones"])


@router.get(
	"/{leccion_id}",
	response_model=LeccionDetailResponse,
	status_code=status.HTTP_200_OK,
)
async def get_leccion(
	leccion_id: UUID,
	db: AsyncSession = Depends(get_db),
	token_payload: Optional[dict] = Depends(get_current_user),
):
	"""Obtener lección con su contenido completo."""
	from app.utils.validators import get_user_info
	
	service = LeccionService(db)
	usuario_id, admin = await get_user_info(db, token_payload)
	
	await service.validate_acceso_leccion(leccion_id, usuario_id, admin)
	
	leccion = await service.get_leccion_with_contenido(leccion_id)
	
	contenido_response = [
		LeccionContenidoResponse.from_orm(cont) for cont in leccion.contenido
	]
	
	return LeccionDetailResponse(
		id=leccion.id,
		modulo_id=leccion.modulo_id,
		titulo=leccion.titulo,
		orden=leccion.orden,
		publicado=leccion.publicado,
		creado_en=leccion.creado_en,
		actualizado_en=leccion.actualizado_en,
		contenido=contenido_response,
	)


@router.get(
	"/{leccion_id}/contenido",
	response_model=List[LeccionContenidoResponse],
	status_code=status.HTTP_200_OK,
)
async def get_contenido_leccion(
	leccion_id: UUID,
	db: AsyncSession = Depends(get_db),
	token_payload: Optional[dict] = Depends(get_current_user),
):
	"""Obtener contenido de una lección."""
	from app.utils.validators import get_user_info
	
	service = LeccionService(db)
	usuario_id, admin = await get_user_info(db, token_payload)
	
	await service.validate_acceso_leccion(leccion_id, usuario_id, admin)
	
	contenido = await service.list_contenido_leccion(leccion_id)
	return [LeccionContenidoResponse.from_orm(cont) for cont in contenido]


@router.post(
	"",
	response_model=LeccionResponse,
	status_code=status.HTTP_201_CREATED,
)
async def create_leccion(
	payload: LeccionCreate,
	_: dict = Depends(require_role([UserRole.ADMIN])),
	db: AsyncSession = Depends(get_db),
):
	"""Crear una nueva lección - solo administradores."""
	service = LeccionService(db)
	leccion = await service.create_leccion(payload.dict())
	return leccion


@router.put(
	"/{leccion_id}",
	response_model=LeccionResponse,
	status_code=status.HTTP_200_OK,
)
async def update_leccion(
	leccion_id: UUID,
	payload: LeccionUpdate,
	_: dict = Depends(require_role([UserRole.ADMIN])),
	db: AsyncSession = Depends(get_db),
):
	"""Actualizar una lección existente - solo administradores."""
	service = LeccionService(db)
	leccion = await service.get_leccion(leccion_id)
	updated = await service.update_leccion(leccion, payload.dict(exclude_unset=True))
	return updated


@router.get(
	"/{leccion_id}/quiz",
	response_model=QuizDetailResponse,
	status_code=status.HTTP_200_OK,
)
async def get_quiz_by_leccion(
	leccion_id: UUID,
	db: AsyncSession = Depends(get_db),
	token_payload: Optional[dict] = Depends(get_current_user),
):
	"""Obtener quiz de una lección."""
	from app.services.quiz_service import QuizService
	from app.utils.validators import get_user_info
	
	service = QuizService(db)
	leccion_service = LeccionService(db)
	
	usuario_id, admin = await get_user_info(db, token_payload)
	
	if not admin and usuario_id:
		await leccion_service.validate_acceso_leccion(leccion_id, usuario_id, admin)
	
	quiz = await service.get_quiz_by_leccion(leccion_id)
	if not quiz:
		from app.utils.exceptions import NotFoundError
		raise NotFoundError("Quiz", f"para lección {leccion_id}")
	
	from sqlalchemy import func
	stmt = select(func.count(models.Pregunta.id)).where(models.Pregunta.quiz_id == quiz.id)
	result = await db.execute(stmt)
	numero_preguntas = result.scalar_one() or 0
	
	return QuizDetailResponse(
		id=quiz.id,
		leccion_id=quiz.leccion_id,
		titulo=quiz.titulo,
		publicado=quiz.publicado,
		aleatorio=quiz.aleatorio,
		guarda_calificacion=quiz.guarda_calificacion,
		creado_en=quiz.creado_en,
		actualizado_en=quiz.actualizado_en,
		numero_preguntas=numero_preguntas,
	)
