import logging
import uuid
from typing import Optional
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError

from app.database import models
from app.utils.exceptions import NotFoundError, ValidationError

logger = logging.getLogger(__name__)


class IntentoService:
	"""Lógica de negocio para intentos de quiz y examen final con protección contra race conditions."""

	def __init__(self, db: AsyncSession):
		self.db = db

	async def create_intento(
		self,
		usuario_id: uuid.UUID,
		inscripcion_curso_id: uuid.UUID,
		quiz_id: Optional[uuid.UUID] = None,
		examen_final_id: Optional[uuid.UUID] = None,
	) -> models.Intento:
		"""
		Crear un nuevo intento con bloqueo pesimista para prevenir race conditions.
		
		Usa SELECT FOR UPDATE para calcular el próximo numero_intento de forma atómica
		y previene múltiples intentos activos simultáneos.
		"""
		if not quiz_id and not examen_final_id:
			raise ValidationError("Debe proporcionar quiz_id o examen_final_id")
		
		if quiz_id and examen_final_id:
			raise ValidationError("No puede proporcionar ambos quiz_id y examen_final_id")

		# Bloqueo pesimista: calcular próximo numero_intento de forma atómica
		# Usar SELECT FOR UPDATE para prevenir race conditions
		# Verificar que no exista un intento activo (finalizado_en IS NULL)
		stmt_activo = select(models.Intento).where(
			and_(
				models.Intento.usuario_id == usuario_id,
				models.Intento.inscripcion_curso_id == inscripcion_curso_id,
				models.Intento.finalizado_en.is_(None),
				or_(
					(quiz_id is not None and models.Intento.quiz_id == quiz_id),
					(examen_final_id is not None and models.Intento.examen_final_id == examen_final_id)
				)
			)
		).with_for_update()
		
		result_activo = await self.db.execute(stmt_activo)
		intento_activo = result_activo.scalar_one_or_none()
		
		if intento_activo:
			raise ValidationError(
				"Ya existe un intento activo para este quiz/examen. "
				"Debe finalizar el intento actual antes de crear uno nuevo."
			)

		# Calcular próximo numero_intento de forma atómica
		if quiz_id:
			stmt_count = select(func.coalesce(func.max(models.Intento.numero_intento), 0)).where(
				and_(
					models.Intento.usuario_id == usuario_id,
					models.Intento.quiz_id == quiz_id,
					models.Intento.inscripcion_curso_id == inscripcion_curso_id
				)
			)
		else:
			stmt_count = select(func.coalesce(func.max(models.Intento.numero_intento), 0)).where(
				and_(
					models.Intento.usuario_id == usuario_id,
					models.Intento.examen_final_id == examen_final_id,
					models.Intento.inscripcion_curso_id == inscripcion_curso_id
				)
			)
		
		result_count = await self.db.execute(stmt_count)
		max_numero = result_count.scalar_one() or 0
		proximo_numero = max_numero + 1

		# Crear nuevo intento
		intento = models.Intento(
			usuario_id=usuario_id,
			inscripcion_curso_id=inscripcion_curso_id,
			quiz_id=quiz_id,
			examen_final_id=examen_final_id,
			numero_intento=proximo_numero,
		)
		
		self.db.add(intento)
		
		try:
			await self.db.commit()
			await self.db.refresh(intento)
			logger.info(
				"Intento creado: usuario_id=%s, quiz_id=%s, examen_final_id=%s, numero_intento=%s",
				usuario_id, quiz_id, examen_final_id, proximo_numero
			)
			return intento
		except IntegrityError as e:
			await self.db.rollback()
			logger.warning(f"IntegrityError al crear intento: {e}")
			# Fallback: el constraint único previno el duplicado
			raise ValidationError(
				"No se pudo crear el intento. Es posible que ya exista un intento con el mismo número."
			) from e

	async def get_intento(self, intento_id: uuid.UUID) -> models.Intento:
		"""Obtener intento por ID con relaciones cargadas."""
		stmt = (
			select(models.Intento)
			.options(
				selectinload(models.Intento.usuario),
				selectinload(models.Intento.quiz),
				selectinload(models.Intento.examen_final),
				selectinload(models.Intento.inscripcion_curso),
				selectinload(models.Intento.preguntas).selectinload(models.IntentoPregunta.pregunta),
			)
			.where(models.Intento.id == intento_id)
		)
		result = await self.db.execute(stmt)
		intento = result.scalar_one_or_none()
		if not intento:
			raise NotFoundError("Intento", str(intento_id))
		return intento

	async def finalizar_intento(
		self,
		intento_id: uuid.UUID,
		puntaje: Optional[float] = None,
		resultado: Optional[str] = None,
	) -> models.Intento:
		"""Finalizar un intento estableciendo puntaje y resultado."""
		intento = await self.get_intento(intento_id)
		
		from datetime import datetime, timezone
		intento.finalizado_en = datetime.now(timezone.utc)
		
		if puntaje is not None:
			intento.puntaje = puntaje
		
		if resultado is not None:
			from app.database.enums import ResultadoIntento
			intento.resultado = ResultadoIntento(resultado)
		
		self.db.add(intento)
		await self.db.commit()
		await self.db.refresh(intento)
		
		logger.info("Intento %s finalizado con puntaje %s", intento_id, puntaje)
		return intento

