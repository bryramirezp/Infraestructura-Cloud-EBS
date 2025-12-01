import logging
import uuid
from typing import List, Optional
<<<<<<< HEAD

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import models
from app.database.enums import EstadoInscripcion
from app.utils.exceptions import NotFoundError, BadRequestError
=======
from datetime import date, datetime, timezone

from sqlalchemy import select, and_, or_, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError

from app.database import models
from app.database.enums import EstadoInscripcion
from app.utils.exceptions import NotFoundError, ValidationError, BusinessRuleError
>>>>>>> 50bb6094d50d71301466789ca430ba62ffdca6f9

logger = logging.getLogger(__name__)


class InscripcionService:
<<<<<<< HEAD
    """Lógica de negocio para inscripciones."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def inscribir_usuario(self, usuario_id: uuid.UUID, curso_id: uuid.UUID) -> models.InscripcionCurso:
        # Verificar si ya existe inscripción
        stmt = select(models.InscripcionCurso).where(
            models.InscripcionCurso.usuario_id == usuario_id,
            models.InscripcionCurso.curso_id == curso_id
        )
        result = await self.db.execute(stmt)
        existing = result.scalar_one_or_none()
        
        if existing:
            if existing.estado == EstadoInscripcion.CANCELADO:
                existing.estado = EstadoInscripcion.ACTIVO
                self.db.add(existing)
                await self.db.commit()
                await self.db.refresh(existing)
                return existing
            raise BadRequestError(f"Usuario ya inscrito en el curso {curso_id}")

        inscripcion = models.InscripcionCurso(
            usuario_id=usuario_id,
            curso_id=curso_id,
            estado=EstadoInscripcion.ACTIVO
        )
        self.db.add(inscripcion)
        await self.db.commit()
        await self.db.refresh(inscripcion)
        logger.info("Usuario %s inscrito en curso %s", usuario_id, curso_id)
        return inscripcion

    async def list_mis_cursos(self, usuario_id: uuid.UUID) -> List[models.InscripcionCurso]:
        stmt = (
            select(models.InscripcionCurso)
            .options(selectinload(models.InscripcionCurso.curso))
            .where(
                models.InscripcionCurso.usuario_id == usuario_id,
                models.InscripcionCurso.estado == EstadoInscripcion.ACTIVO
            )
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()
=======
	"""Lógica de negocio para inscripciones a cursos."""

	def __init__(self, db: AsyncSession):
		self.db = db

	async def get_curso(self, curso_id: uuid.UUID) -> models.Curso:
		"""Obtener curso por ID."""
		from app.utils.query_helpers import get_or_404
		return await get_or_404(self.db, models.Curso, curso_id, "Curso")

	async def get_inscripcion(self, inscripcion_id: uuid.UUID) -> models.InscripcionCurso:
		"""Obtener inscripción por ID."""
		stmt = (
			select(models.InscripcionCurso)
			.options(
				selectinload(models.InscripcionCurso.curso),
				selectinload(models.InscripcionCurso.usuario),
			)
			.where(models.InscripcionCurso.id == inscripcion_id)
		)
		result = await self.db.execute(stmt)
		inscripcion = result.scalar_one_or_none()
		if not inscripcion:
			raise NotFoundError("Inscripción", str(inscripcion_id))
		return inscripcion

	async def get_inscripcion_by_usuario_curso(
		self,
		usuario_id: uuid.UUID,
		curso_id: uuid.UUID,
	) -> Optional[models.InscripcionCurso]:
		"""Obtener inscripción de un usuario a un curso."""
		stmt = select(models.InscripcionCurso).where(
			and_(
				models.InscripcionCurso.usuario_id == usuario_id,
				models.InscripcionCurso.curso_id == curso_id,
			)
		)
		result = await self.db.execute(stmt)
		return result.scalar_one_or_none()

	async def list_inscripciones_by_usuario(
		self,
		usuario_id: uuid.UUID,
		estado: Optional[EstadoInscripcion] = None,
		skip: int = 0,
		limit: int = 100,
	) -> List[models.InscripcionCurso]:
		"""Listar inscripciones de un usuario."""
		stmt = (
			select(models.InscripcionCurso)
			.options(selectinload(models.InscripcionCurso.curso))
			.where(models.InscripcionCurso.usuario_id == usuario_id)
		)
		
		if estado:
			stmt = stmt.where(models.InscripcionCurso.estado == estado)
		
		stmt = stmt.order_by(models.InscripcionCurso.fecha_inscripcion.desc()).offset(skip).limit(limit)
		result = await self.db.execute(stmt)
		return result.scalars().all()

	async def validate_curso_disponible(self, curso_id: uuid.UUID) -> None:
		"""Validar que el curso esté disponible para inscripción."""
		curso = await self.get_curso(curso_id)
		
		if not curso.publicado:
			raise BusinessRuleError("El curso no está disponible para inscripción")

	async def create_inscripcion(
		self,
		usuario_id: uuid.UUID,
		curso_id: uuid.UUID,
		fecha_inscripcion: Optional[date] = None,
	) -> models.InscripcionCurso:
		"""
		Crear una nueva inscripción.
		Nota: Los triggers de BD validan transiciones de estado y acreditación.
		"""
		await self.validate_curso_disponible(curso_id)
		
		inscripcion_existente = await self.get_inscripcion_by_usuario_curso(usuario_id, curso_id)
		if inscripcion_existente:
			raise BusinessRuleError(
				"Ya estás inscrito en este curso. "
				f"Estado actual: {inscripcion_existente.estado.value}"
			)
		
		if fecha_inscripcion is None:
			fecha_inscripcion = date.today()
		
		inscripcion = models.InscripcionCurso(
			usuario_id=usuario_id,
			curso_id=curso_id,
			fecha_inscripcion=fecha_inscripcion,
			estado=EstadoInscripcion.ACTIVA,
		)
		
		self.db.add(inscripcion)
		
		try:
			await self.db.commit()
			await self.db.refresh(inscripcion)
			logger.info(
				"Inscripción creada: usuario_id=%s, curso_id=%s",
				usuario_id,
				curso_id,
			)
			return inscripcion
		except IntegrityError as e:
			await self.db.rollback()
			logger.warning(f"IntegrityError al crear inscripción: {e}")
			raise BusinessRuleError(
				"No se pudo crear la inscripción. Es posible que ya exista una inscripción para este curso."
			) from e

	async def update_estado_inscripcion(
		self,
		inscripcion_id: uuid.UUID,
		nuevo_estado: EstadoInscripcion,
	) -> models.InscripcionCurso:
		"""
		Actualizar estado de inscripción.
		Nota: El trigger validar_transicion_estado_inscripcion valida las transiciones permitidas.
		"""
		inscripcion = await self.get_inscripcion(inscripcion_id)
		
		if inscripcion.estado == nuevo_estado:
			return inscripcion
		
		inscripcion.estado = nuevo_estado
		
		if nuevo_estado in [EstadoInscripcion.CONCLUIDA, EstadoInscripcion.REPROBADA]:
			if inscripcion.fecha_conclusion is None:
				inscripcion.fecha_conclusion = date.today()
		
		self.db.add(inscripcion)
		
		try:
			await self.db.commit()
			await self.db.refresh(inscripcion)
			logger.info(
				"Estado de inscripción %s actualizado a %s",
				inscripcion_id,
				nuevo_estado.value,
			)
			return inscripcion
		except Exception as e:
			await self.db.rollback()
			logger.error(f"Error al actualizar estado de inscripción: {e}")
			raise BusinessRuleError(
				f"No se pudo cambiar el estado. Transición inválida: {inscripcion.estado.value} -> {nuevo_estado.value}"
			) from e

	async def pausar_inscripcion(
		self,
		inscripcion_id: uuid.UUID,
	) -> models.InscripcionCurso:
		"""Pausar una inscripción."""
		return await self.update_estado_inscripcion(inscripcion_id, EstadoInscripcion.PAUSADA)

	async def reanudar_inscripcion(
		self,
		inscripcion_id: uuid.UUID,
	) -> models.InscripcionCurso:
		"""Reanudar una inscripción pausada."""
		inscripcion = await self.get_inscripcion(inscripcion_id)
		
		if inscripcion.estado != EstadoInscripcion.PAUSADA:
			raise BusinessRuleError(
				f"No se puede reanudar una inscripción con estado {inscripcion.estado.value}. "
				"Solo se pueden reanudar inscripciones pausadas."
			)
		
		return await self.update_estado_inscripcion(inscripcion_id, EstadoInscripcion.ACTIVA)

>>>>>>> 50bb6094d50d71301466789ca430ba62ffdca6f9
