import logging
import uuid
from typing import List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import models
from app.utils.exceptions import NotFoundError
from app.schemas.guia_estudio import GuiaEstudioResponse
from app.schemas.examen_final import ExamenFinalDetailResponse
from app.services.s3_service import S3Service
from app.services.examen_final_service import ExamenFinalService
from sqlalchemy import func

logger = logging.getLogger(__name__)


class CursoService:
	"""Lógica de negocio para cursos (materias)."""

	def __init__(self, db: AsyncSession):
		self.db = db

	async def list_cursos(
		self,
		*,
		publicado: Optional[bool] = None,
		modulo_id: Optional[uuid.UUID] = None,
		skip: int = 0,
		limit: int = 100,
	) -> List[models.Curso]:
		stmt = select(models.Curso)
		if publicado is not None:
			stmt = stmt.where(models.Curso.publicado == publicado)

		if modulo_id is not None:
			stmt = (
				stmt.join(models.ModuloCurso, models.ModuloCurso.curso_id == models.Curso.id)
				.where(models.ModuloCurso.modulo_id == modulo_id)
			)

		stmt = stmt.order_by(models.Curso.titulo.asc()).offset(skip).limit(limit)
		result = await self.db.execute(stmt)
		cursos = result.scalars().all()
		logger.debug("Cursos recuperados: %s", len(cursos))
		return cursos

	async def get_curso(self, curso_id: uuid.UUID) -> models.Curso:
		"""Obtener curso por ID sin relaciones (optimizado para casos simples)."""
		from app.utils.query_helpers import get_or_404
		return await get_or_404(self.db, models.Curso, curso_id, "Curso")

	async def get_curso_with_relations(self, curso_id: uuid.UUID) -> models.Curso:
		stmt = (
			select(models.Curso)
			.options(
				selectinload(models.Curso.guias_estudio),
				selectinload(models.Curso.examen_final),
				selectinload(models.Curso.modulos).selectinload(models.ModuloCurso.modulo),
			)
			.where(models.Curso.id == curso_id)
		)
		result = await self.db.execute(stmt)
		curso = result.scalar_one_or_none()
		if not curso:
			raise NotFoundError("Curso", str(curso_id))
		return curso

	async def create_curso(self, data: dict) -> models.Curso:
		curso = models.Curso(**data)
		self.db.add(curso)
		await self.db.commit()
		await self.db.refresh(curso)
		logger.info("Curso %s creado", curso.id)
		return curso

	async def update_curso(self, curso: models.Curso, data: dict) -> models.Curso:
		if not data:
			return curso

		allowed_fields = {"titulo", "descripcion", "publicado"}
		for field, value in data.items():
			if field in allowed_fields and value is not None:
				setattr(curso, field, value)

		self.db.add(curso)
		await self.db.commit()
		await self.db.refresh(curso)
		logger.info("Curso %s actualizado", curso.id)
		return curso

	async def list_guias_estudio(self, curso_id: uuid.UUID, activo: Optional[bool] = None) -> List[models.GuiaEstudio]:
		stmt = select(models.GuiaEstudio).where(models.GuiaEstudio.curso_id == curso_id)
		
		if activo is not None:
			stmt = stmt.where(models.GuiaEstudio.activo == activo)
		
		stmt = stmt.order_by(models.GuiaEstudio.creado_en.desc())
		result = await self.db.execute(stmt)
		guias = result.scalars().all()
		logger.debug("Guias de estudio recuperadas para curso %s: %s", curso_id, len(guias))
		return guias

	async def get_guias_estudio_con_urls(
		self,
		curso_id: uuid.UUID,
		activo: Optional[bool] = True,
	) -> List[GuiaEstudioResponse]:
		"""
		Obtener guías de estudio de un curso con URLs prefirmadas si están en S3.
		Este método encapsula la lógica de transformación de URLs S3.
		"""
		guias = await self.list_guias_estudio(curso_id, activo=activo)
		s3_service = S3Service()
		
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

	async def get_examen_final_con_conteo(
		self,
		curso_id: uuid.UUID,
	) -> ExamenFinalDetailResponse:
		"""
		Obtener examen final de un curso con conteo de preguntas.
		Este método encapsula la lógica de conteo y construcción de respuesta.
		"""
		examen_service = ExamenFinalService(self.db)
		examen = await examen_service.get_examen_final_by_curso(curso_id)
		
		if not examen:
			raise NotFoundError("Examen final", f"para curso {curso_id}")
		
		stmt = select(func.count(models.Pregunta.id)).where(models.Pregunta.examen_final_id == examen.id)
		result = await self.db.execute(stmt)
		numero_preguntas = result.scalar_one() or 0
		
		return ExamenFinalDetailResponse(
			id=examen.id,
			curso_id=examen.curso_id,
			titulo=examen.titulo,
			publicado=examen.publicado,
			aleatorio=examen.aleatorio,
			guarda_calificacion=examen.guarda_calificacion,
			creado_en=examen.creado_en,
			actualizado_en=examen.actualizado_en,
			numero_preguntas=numero_preguntas,
		)

	async def list_modulos_by_curso(self, curso_id: uuid.UUID) -> List[models.Modulo]:
		"""Listar módulos asociados a un curso."""
		stmt = (
			select(models.Modulo)
			.join(models.ModuloCurso, models.ModuloCurso.modulo_id == models.Modulo.id)
			.where(models.ModuloCurso.curso_id == curso_id)
			.order_by(models.ModuloCurso.slot.asc())
		)
		result = await self.db.execute(stmt)
		modulos = result.scalars().all()
		logger.debug("Módulos recuperados para curso %s: %s", curso_id, len(modulos))
		return modulos