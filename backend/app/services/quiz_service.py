import logging
import uuid
from typing import Optional, List
from decimal import Decimal
from datetime import datetime, timezone

from sqlalchemy import select, func, and_, or_, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import models
from app.database.enums import ResultadoIntento, TipoPregunta
from app.utils.exceptions import NotFoundError, AuthorizationError, BusinessRuleError, ValidationError
from app.services.intento_service import IntentoService
from app.services.inscripcion_service import InscripcionService
from app.schemas.intento import IntentoResult, RespuestaResponse

logger = logging.getLogger(__name__)


class QuizService:
	"""Lógica de negocio para quizzes."""

	def __init__(self, db: AsyncSession):
		self.db = db
		self.intento_service = IntentoService(db)
		self.inscripcion_service = InscripcionService(db)

	async def get_quiz(self, quiz_id: uuid.UUID) -> models.Quiz:
		"""Obtener quiz por ID con lección cargada (N-a-1 usa joinedload)."""
		from sqlalchemy.orm import joinedload
		stmt = (
			select(models.Quiz)
			.options(joinedload(models.Quiz.leccion))
			.where(models.Quiz.id == quiz_id)
		)
		result = await self.db.execute(stmt)
		quiz = result.scalar_one_or_none()
		if not quiz:
			raise NotFoundError("Quiz", str(quiz_id))
		return quiz

	async def get_quiz_by_leccion(self, leccion_id: uuid.UUID) -> Optional[models.Quiz]:
		"""Obtener quiz de una lección con lección cargada."""
		from sqlalchemy.orm import joinedload
		stmt = (
			select(models.Quiz)
			.options(joinedload(models.Quiz.leccion))
			.where(models.Quiz.leccion_id == leccion_id)
		)
		result = await self.db.execute(stmt)
		return result.scalar_one_or_none()

	async def get_quiz_with_preguntas(self, quiz_id: uuid.UUID) -> models.Quiz:
		"""Obtener quiz con todas sus preguntas y opciones."""
		stmt = (
			select(models.Quiz)
			.options(
				selectinload(models.Quiz.preguntas).selectinload(models.Pregunta.config),
				selectinload(models.Quiz.preguntas).selectinload(models.Pregunta.opciones),
			)
			.where(models.Quiz.id == quiz_id)
		)
		result = await self.db.execute(stmt)
		quiz = result.scalar_one_or_none()
		if not quiz:
			raise NotFoundError("Quiz", str(quiz_id))
		return quiz

	async def get_regla_acreditacion(
		self,
		curso_id: uuid.UUID,
		quiz_id: Optional[uuid.UUID] = None,
	) -> Optional[models.ReglaAcreditacion]:
		"""Obtener regla de acreditación activa para un quiz."""
		stmt = select(models.ReglaAcreditacion).where(
			and_(
				models.ReglaAcreditacion.curso_id == curso_id,
				models.ReglaAcreditacion.activa == True,
			)
		)
		
		if quiz_id:
			stmt = stmt.where(
				or_(
					models.ReglaAcreditacion.quiz_id == quiz_id,
					models.ReglaAcreditacion.quiz_id.is_(None),
				)
			)
		else:
			stmt = stmt.where(models.ReglaAcreditacion.quiz_id.is_(None))
		
		stmt = stmt.order_by(
			# Priorizar reglas específicas sobre generales
			models.ReglaAcreditacion.quiz_id.isnot(None).desc()
		).limit(1)
		
		result = await self.db.execute(stmt)
		return result.scalar_one_or_none()

	async def validate_max_intentos(
		self,
		usuario_id: uuid.UUID,
		quiz_id: uuid.UUID,
		inscripcion_curso_id: uuid.UUID,
	) -> None:
		"""
		Validar que no se exceda el máximo de intentos.
		Nota: El trigger de BD también valida esto, pero es útil para dar feedback antes.
		"""
		quiz = await self.get_quiz(quiz_id)
		
		leccion = await self.db.execute(
			select(models.Leccion).where(models.Leccion.id == quiz.leccion_id)
		)
		leccion_obj = leccion.scalar_one()
		
		modulo_curso = await self.db.execute(
			select(models.ModuloCurso)
			.where(models.ModuloCurso.modulo_id == leccion_obj.modulo_id)
			.limit(1)
		)
		modulo_curso_obj = modulo_curso.scalar_one_or_none()
		
		if not modulo_curso_obj:
			raise ValidationError("No se encontró curso asociado al módulo de la lección")
		
		regla = await self.get_regla_acreditacion(
			modulo_curso_obj.curso_id,
			quiz_id=quiz_id,
		)
		
		max_intentos = regla.max_intentos_quiz if regla else 3
		
		stmt = select(func.count(models.Intento.id)).where(
			and_(
				models.Intento.usuario_id == usuario_id,
				models.Intento.quiz_id == quiz_id,
				models.Intento.inscripcion_curso_id == inscripcion_curso_id,
			)
		)
		result = await self.db.execute(stmt)
		intentos_count = result.scalar_one() or 0
		
		if intentos_count >= max_intentos:
			raise BusinessRuleError(
				f"Máximo de intentos alcanzado. Máximo permitido: {max_intentos}"
			)

	async def iniciar_intento(
		self,
		usuario_id: uuid.UUID,
		quiz_id: uuid.UUID,
		inscripcion_curso_id: uuid.UUID,
	) -> models.Intento:
		"""Iniciar un nuevo intento de quiz."""
		await self.validate_max_intentos(usuario_id, quiz_id, inscripcion_curso_id)
		
		intento = await self.intento_service.create_intento(
			usuario_id=usuario_id,
			inscripcion_curso_id=inscripcion_curso_id,
			quiz_id=quiz_id,
		)
		
		quiz = await self.get_quiz_with_preguntas(quiz_id)
		
		orden = 1
		for pregunta in quiz.preguntas:
			intento_pregunta = models.IntentoPregunta(
				intento_id=intento.id,
				pregunta_id=pregunta.id,
				puntos_maximos=pregunta.puntos,
				orden=orden,
			)
			self.db.add(intento_pregunta)
			orden += 1
		
		await self.db.commit()
		await self.db.refresh(intento)
		
		logger.info("Intento de quiz %s iniciado para usuario %s", quiz_id, usuario_id)
		return intento

	async def calcular_puntaje(
		self,
		intento_id: uuid.UUID,
	) -> tuple[Decimal, Decimal, int, int]:
		"""
		Calcular puntaje del intento usando la vista respuesta_con_evaluacion.
		Retorna: (puntaje_total, puntaje_maximo, preguntas_correctas, total_preguntas)
		"""
		stmt = text("""
			SELECT 
				COALESCE(SUM(rce.puntos_otorgados), 0) as puntaje_total,
				COALESCE(SUM(ip.puntos_maximos), 0) as puntaje_maximo,
				COUNT(CASE WHEN rce.es_correcta = TRUE THEN 1 END) as preguntas_correctas,
				COUNT(ip.id) as total_preguntas
			FROM intento_pregunta ip
			LEFT JOIN respuesta r ON r.intento_pregunta_id = ip.id
			LEFT JOIN respuesta_con_evaluacion rce ON rce.id = r.id
			WHERE ip.intento_id = :intento_id
		""")
		
		result = await self.db.execute(stmt, {"intento_id": intento_id})
		row = result.fetchone()
		
		if not row:
			return Decimal("0"), Decimal("0"), 0, 0
		
		puntaje_total = Decimal(str(row[0])) if row[0] else Decimal("0")
		puntaje_maximo = Decimal(str(row[1])) if row[1] else Decimal("0")
		preguntas_correctas = row[2] or 0
		total_preguntas = row[3] or 0
		
		return puntaje_total, puntaje_maximo, preguntas_correctas, total_preguntas

	async def enviar_respuestas(
		self,
		intento_id: uuid.UUID,
		respuestas: List[dict],
	) -> models.Intento:
		"""
		Enviar respuestas de un intento y calcular puntaje.
		"""
		intento = await self.intento_service.get_intento(intento_id)
		
		if intento.finalizado_en:
			raise BusinessRuleError("Este intento ya fue finalizado")
		
		intento_preguntas = await self.db.execute(
			select(models.IntentoPregunta)
			.where(models.IntentoPregunta.intento_id == intento_id)
		)
		intento_preguntas_list = intento_preguntas.scalars().all()
		
		preguntas_map = {ip.pregunta_id: ip for ip in intento_preguntas_list}
		
		for respuesta_data in respuestas:
			pregunta_id = respuesta_data.get("pregunta_id")
			if pregunta_id not in preguntas_map:
				raise ValidationError(f"Pregunta {pregunta_id} no pertenece a este intento")
			
			intento_pregunta = preguntas_map[pregunta_id]
			
			respuesta = models.Respuesta(
				intento_pregunta_id=intento_pregunta.id,
				respuesta_texto=respuesta_data.get("respuesta_texto"),
				opcion_id=respuesta_data.get("opcion_id"),
				respuesta_bool=respuesta_data.get("respuesta_bool"),
			)
			self.db.add(respuesta)
		
		await self.db.commit()
		
		puntaje_total, puntaje_maximo, preguntas_correctas, total_preguntas = await self.calcular_puntaje(intento_id)
		
		quiz = await self.get_quiz(intento.quiz_id)
		leccion = await self.db.execute(
			select(models.Leccion).where(models.Leccion.id == quiz.leccion_id)
		)
		leccion_obj = leccion.scalar_one()
		
		modulo_curso = await self.db.execute(
			select(models.ModuloCurso)
			.where(models.ModuloCurso.modulo_id == leccion_obj.modulo_id)
			.limit(1)
		)
		modulo_curso_obj = modulo_curso.scalar_one_or_none()
		
		if not modulo_curso_obj:
			raise ValidationError("No se encontró curso asociado")
		
		regla = await self.get_regla_acreditacion(
			modulo_curso_obj.curso_id,
			quiz_id=intento.quiz_id,
		)
		
		min_score = regla.min_score_aprobatorio if regla else Decimal("80.00")
		
		porcentaje = (puntaje_total / puntaje_maximo * 100) if puntaje_maximo > 0 else Decimal("0")
		aprobado = porcentaje >= min_score
		
		await self.intento_service.finalizar_intento(
			intento_id=intento_id,
			puntaje=float(porcentaje),
			resultado=ResultadoIntento.APROBADO if aprobado else ResultadoIntento.NO_APROBADO,
		)
		
		await self.db.refresh(intento)
		logger.info(
			"Intento %s finalizado: puntaje=%.2f%%, aprobado=%s",
			intento_id,
			porcentaje,
			aprobado,
		)
		
		return intento

	async def list_intentos(
		self,
		quiz_id: uuid.UUID,
		usuario_id: Optional[uuid.UUID] = None,
		skip: int = 0,
		limit: int = 100,
	) -> List[models.Intento]:
		"""Listar intentos de un quiz."""
		stmt = select(models.Intento).where(models.Intento.quiz_id == quiz_id)
		
		if usuario_id:
			stmt = stmt.where(models.Intento.usuario_id == usuario_id)
		
		stmt = stmt.order_by(models.Intento.numero_intento.desc()).offset(skip).limit(limit)
		result = await self.db.execute(stmt)
		return result.scalars().all()

	async def get_inscripcion_curso_from_quiz(
		self,
		quiz_id: uuid.UUID,
		usuario_id: uuid.UUID,
	) -> models.InscripcionCurso:
		"""
		Obtener la inscripción del usuario al curso asociado al quiz.
		Valida que el usuario esté inscrito en el curso.
		"""
		quiz = await self.get_quiz(quiz_id)
		
		leccion = await self.db.execute(
			select(models.Leccion).where(models.Leccion.id == quiz.leccion_id)
		)
		leccion_obj = leccion.scalar_one()
		
		modulo_curso = await self.db.execute(
			select(models.ModuloCurso)
			.where(models.ModuloCurso.modulo_id == leccion_obj.modulo_id)
			.limit(1)
		)
		modulo_curso_obj = modulo_curso.scalar_one_or_none()
		
		if not modulo_curso_obj:
			raise ValidationError("No se encontró curso asociado al módulo de la lección")
		
		inscripcion = await self.inscripcion_service.get_inscripcion_by_usuario_curso(
			usuario_id=usuario_id,
			curso_id=modulo_curso_obj.curso_id,
		)
		
		if not inscripcion:
			raise AuthorizationError("No estás inscrito en este curso")
		
		return inscripcion

	async def get_intento_activo(
		self,
		quiz_id: uuid.UUID,
		usuario_id: uuid.UUID,
		inscripcion_curso_id: uuid.UUID,
	) -> models.Intento:
		"""Obtener el intento activo (no finalizado) para un quiz."""
		stmt = select(models.Intento).where(
			and_(
				models.Intento.usuario_id == usuario_id,
				models.Intento.quiz_id == quiz_id,
				models.Intento.inscripcion_curso_id == inscripcion_curso_id,
				models.Intento.finalizado_en.is_(None),
			)
		)
		result = await self.db.execute(stmt)
		intento = result.scalar_one_or_none()
		
		if not intento:
			raise ValidationError("No hay un intento activo para este quiz")
		
		return intento

	async def construir_intento_result(
		self,
		intento: models.Intento,
	) -> IntentoResult:
		"""
		Construir objeto IntentoResult completo después de enviar respuestas.
		Incluye puntaje, respuestas y estadísticas.
		"""
		puntaje_total, puntaje_maximo, preguntas_correctas, total_preguntas = await self.calcular_puntaje(intento.id)
		
		quiz = await self.get_quiz(intento.quiz_id)
		leccion = await self.db.execute(
			select(models.Leccion).where(models.Leccion.id == quiz.leccion_id)
		)
		leccion_obj = leccion.scalar_one()
		
		modulo_curso = await self.db.execute(
			select(models.ModuloCurso)
			.where(models.ModuloCurso.modulo_id == leccion_obj.modulo_id)
			.limit(1)
		)
		modulo_curso_obj = modulo_curso.scalar_one_or_none()
		
		if not modulo_curso_obj:
			raise ValidationError("No se encontró curso asociado")
		
		regla = await self.get_regla_acreditacion(
			modulo_curso_obj.curso_id,
			quiz_id=intento.quiz_id,
		)
		
		min_score = regla.min_score_aprobatorio if regla else Decimal("80.00")
		porcentaje = (puntaje_total / puntaje_maximo * 100) if puntaje_maximo > 0 else Decimal("0")
		
		respuestas_stmt = await self.db.execute(
			select(models.Respuesta)
			.join(models.IntentoPregunta)
			.where(models.IntentoPregunta.intento_id == intento.id)
		)
		respuestas = respuestas_stmt.scalars().all()
		
		return IntentoResult(
			intento_id=intento.id,
			puntaje=porcentaje,
			puntaje_maximo=puntaje_maximo,
			porcentaje=porcentaje,
			resultado=intento.resultado,
			aprobado=intento.resultado == ResultadoIntento.APROBADO,
			min_score_aprobatorio=min_score,
			preguntas_correctas=preguntas_correctas,
			total_preguntas=total_preguntas,
			respuestas=[RespuestaResponse.from_orm(r) for r in respuestas],
		)

	async def iniciar_intento_con_validacion(
		self,
		usuario_id: uuid.UUID,
		quiz_id: uuid.UUID,
	) -> models.Intento:
		"""
		Iniciar intento de quiz con validación de inscripción.
		Este método encapsula toda la lógica: obtiene inscripción, valida acceso e inicia intento.
		"""
		inscripcion = await self.get_inscripcion_curso_from_quiz(quiz_id, usuario_id)
		
		return await self.iniciar_intento(
			usuario_id=usuario_id,
			quiz_id=quiz_id,
			inscripcion_curso_id=inscripcion.id,
		)

	async def enviar_respuestas_con_validacion(
		self,
		usuario_id: uuid.UUID,
		quiz_id: uuid.UUID,
		respuestas: List[dict],
	) -> IntentoResult:
		"""
		Enviar respuestas de un quiz con validación completa.
		Este método encapsula toda la lógica: valida inscripción, obtiene intento activo, envía respuestas y construye resultado.
		"""
		inscripcion = await self.get_inscripcion_curso_from_quiz(quiz_id, usuario_id)
		
		intento_activo = await self.get_intento_activo(quiz_id, usuario_id, inscripcion.id)
		
		intento = await self.enviar_respuestas(
			intento_id=intento_activo.id,
			respuestas=respuestas,
		)
		
		return await self.construir_intento_result(intento)

