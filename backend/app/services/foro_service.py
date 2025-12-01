import logging
import uuid
from typing import List, Optional

from sqlalchemy import select, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import models
from app.database.enums import EstadoInscripcion
from app.utils.exceptions import NotFoundError, AuthorizationError, BusinessRuleError

logger = logging.getLogger(__name__)


class ForoService:
	"""Lógica de negocio para comentarios en foro."""

	def __init__(self, db: AsyncSession):
		self.db = db

	async def get_comentario(self, comentario_id: uuid.UUID) -> models.ForoComentario:
		"""Obtener comentario por ID."""
		stmt = (
			select(models.ForoComentario)
			.options(
				selectinload(models.ForoComentario.usuario),
				selectinload(models.ForoComentario.curso),
				selectinload(models.ForoComentario.leccion),
			)
			.where(models.ForoComentario.id == comentario_id)
		)
		result = await self.db.execute(stmt)
		comentario = result.scalar_one_or_none()
		if not comentario:
			raise NotFoundError("Comentario", str(comentario_id))
		return comentario

	async def list_comentarios_by_leccion(
		self,
		curso_id: uuid.UUID,
		leccion_id: uuid.UUID,
		skip: int = 0,
		limit: int = 100,
	) -> List[models.ForoComentario]:
		"""Listar comentarios de una lección."""
		stmt = (
			select(models.ForoComentario)
			.options(
				selectinload(models.ForoComentario.usuario),
			)
			.where(
				and_(
					models.ForoComentario.curso_id == curso_id,
					models.ForoComentario.leccion_id == leccion_id,
				)
			)
			.order_by(models.ForoComentario.creado_en.asc())
			.offset(skip)
			.limit(limit)
		)
		result = await self.db.execute(stmt)
		return result.scalars().all()

	async def validate_usuario_inscrito(
		self,
		usuario_id: uuid.UUID,
		curso_id: uuid.UUID,
	) -> None:
		"""Validar que el usuario esté inscrito en el curso."""
		stmt = select(models.InscripcionCurso).where(
			and_(
				models.InscripcionCurso.usuario_id == usuario_id,
				models.InscripcionCurso.curso_id == curso_id,
				models.InscripcionCurso.estado.in_([
					EstadoInscripcion.ACTIVA,
					EstadoInscripcion.PAUSADA,
					EstadoInscripcion.CONCLUIDA,
				]),
			)
		)
		result = await self.db.execute(stmt)
		inscripcion = result.scalar_one_or_none()
		if not inscripcion:
			raise BusinessRuleError(
				"Debes estar inscrito en el curso para participar en el foro."
			)

	async def validate_leccion_pertenece_curso(
		self,
		leccion_id: uuid.UUID,
		curso_id: uuid.UUID,
	) -> None:
		"""Validar que la lección pertenezca al módulo del curso."""
		leccion = await self.db.execute(
			select(models.Leccion).where(models.Leccion.id == leccion_id)
		)
		leccion_obj = leccion.scalar_one_or_none()
		if not leccion_obj:
			raise NotFoundError("Lección", str(leccion_id))
		
		modulo_curso = await self.db.execute(
			select(models.ModuloCurso).where(
				and_(
					models.ModuloCurso.modulo_id == leccion_obj.modulo_id,
					models.ModuloCurso.curso_id == curso_id,
				)
			)
		)
		modulo_curso_obj = modulo_curso.scalar_one_or_none()
		if not modulo_curso_obj:
			raise BusinessRuleError(
				"La lección no pertenece al curso especificado."
			)

	async def create_comentario(
		self,
		usuario_id: uuid.UUID,
		curso_id: uuid.UUID,
		leccion_id: uuid.UUID,
		contenido: str,
	) -> models.ForoComentario:
		"""Crear un nuevo comentario."""
		await self.validate_usuario_inscrito(usuario_id, curso_id)
		await self.validate_leccion_pertenece_curso(leccion_id, curso_id)
		
		if not contenido or not contenido.strip():
			raise BusinessRuleError("El contenido del comentario no puede estar vacío.")
		
		comentario = models.ForoComentario(
			usuario_id=usuario_id,
			curso_id=curso_id,
			leccion_id=leccion_id,
			contenido=contenido.strip(),
		)
		
		self.db.add(comentario)
		await self.db.commit()
		await self.db.refresh(comentario)
		logger.info(
			"Comentario creado: usuario_id=%s, curso_id=%s, leccion_id=%s",
			usuario_id,
			curso_id,
			leccion_id,
		)
		return comentario

	async def update_comentario(
		self,
		comentario_id: uuid.UUID,
		usuario_id: uuid.UUID,
		contenido: str,
	) -> models.ForoComentario:
		"""Actualizar un comentario existente."""
		comentario = await self.get_comentario(comentario_id)
		
		if comentario.usuario_id != usuario_id:
			raise AuthorizationError("Solo puedes editar tus propios comentarios.")
		
		if not contenido or not contenido.strip():
			raise BusinessRuleError("El contenido del comentario no puede estar vacío.")
		
		comentario.contenido = contenido.strip()
		
		self.db.add(comentario)
		await self.db.commit()
		await self.db.refresh(comentario)
		logger.info("Comentario %s actualizado", comentario_id)
		return comentario

	async def delete_comentario(
		self,
		comentario_id: uuid.UUID,
		usuario_id: uuid.UUID,
		is_admin: bool = False,
	) -> None:
		"""Eliminar un comentario."""
		comentario = await self.get_comentario(comentario_id)
		
		if not is_admin and comentario.usuario_id != usuario_id:
			raise AuthorizationError("Solo puedes eliminar tus propios comentarios.")
		
		stmt = delete(models.ForoComentario).where(models.ForoComentario.id == comentario_id)
		await self.db.execute(stmt)
		await self.db.commit()
		logger.info("Comentario %s eliminado", comentario_id)
