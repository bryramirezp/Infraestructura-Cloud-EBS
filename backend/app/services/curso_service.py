import logging
import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import models
from app.utils.exceptions import NotFoundError

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
	) -> List[models.Curso]:
		stmt = select(models.Curso)
		if publicado is not None:
			stmt = stmt.where(models.Curso.publicado == publicado)

		if modulo_id is not None:
			stmt = (
				stmt.join(models.ModuloCurso, models.ModuloCurso.curso_id == models.Curso.id)
				.where(models.ModuloCurso.modulo_id == modulo_id)
			)

		stmt = stmt.order_by(models.Curso.titulo.asc())
		result = await self.db.execute(stmt)
		cursos = result.scalars().all()
		logger.debug("Cursos recuperados: %s", len(cursos))
		return cursos

	async def get_curso(self, curso_id: uuid.UUID) -> models.Curso:
		stmt = select(models.Curso).where(models.Curso.id == curso_id)
		result = await self.db.execute(stmt)
		curso = result.scalar_one_or_none()
		if not curso:
			raise NotFoundError("Curso", str(curso_id))
		return curso

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
