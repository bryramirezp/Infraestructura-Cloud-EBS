import logging
import uuid
from typing import Optional, List
from decimal import Decimal

from sqlalchemy import select, func, and_, or_, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import models
from app.database.enums import ResultadoIntento
from app.utils.exceptions import NotFoundError, AuthorizationError, BusinessRuleError, ValidationError
from app.services.intento_service import IntentoService
from app.services.quiz_service import QuizService
from app.services.inscripcion_service import InscripcionService
from app.schemas.intento import IntentoResult, RespuestaResponse

logger = logging.getLogger(__name__)


class ExamenFinalService:
	"""Lógica de negocio para exámenes finales."""

	def __init__(self, db: AsyncSession):
		self.db = db
		self.intento_service = IntentoService(db)
		self.quiz_service = QuizService(db)
		self.inscripcion_service = InscripcionService(db)

	async def get_examen_final(self, examen_final_id: uuid.UUID) -> models.ExamenFinal:
		"""Obtener examen final por ID con curso cargado (N-a-1 usa joinedload)."""
		from sqlalchemy.orm import joinedload
		stmt = (
			select(models.ExamenFinal)
			.options(joinedload(models.ExamenFinal.curso))
			.where(models.ExamenFinal.id == examen_final_id)
		)
		result = await self.db.execute(stmt)
		examen = result.scalar_one_or_none()
		if not examen:
			raise NotFoundError("Examen final", str(examen_final_id))
		return examen

	async def get_examen_final_by_curso(self, curso_id: uuid.UUID) -> Optional[models.ExamenFinal]:
		"""Obtener examen final de un curso con curso cargado."""
		from sqlalchemy.orm import joinedload
		stmt = (
			select(models.ExamenFinal)
			.options(joinedload(models.ExamenFinal.curso))
			.where(models.ExamenFinal.curso_id == curso_id)
		)
		result = await self.db.execute(stmt)
		return result.scalar_one_or_none()

	async def get_examen_final_with_preguntas(self, examen_final_id: uuid.UUID) -> models.ExamenFinal:
		"""Obtener examen final con todas sus preguntas y opciones."""
		stmt = (
			select(models.ExamenFinal)
			.options(
				selectinload(models.ExamenFinal.preguntas).selectinload(models.Pregunta.config),
				selectinload(models.ExamenFinal.preguntas).selectinload(models.Pregunta.opciones),
			)
			.where(models.ExamenFinal.id == examen_final_id)
		)
		result = await self.db.execute(stmt)
		examen = result.scalar_one_or_none()
		if not examen:
			raise NotFoundError("Examen final", str(examen_final_id))
		return examen

	async def get_regla_acreditacion(
		self,
		curso_id: uuid.UUID,
		examen_final_id: Optional[uuid.UUID] = None,
	) -> Optional[models.ReglaAcreditacion]:
		"""Obtener regla de acreditación activa para un examen final."""
		stmt = select(models.ReglaAcreditacion).where(
			and_(
				models.ReglaAcreditacion.curso_id == curso_id,
				models.ReglaAcreditacion.activa == True,
			)
		)
		
		if examen_final_id:
			stmt = stmt.where(
				or_(
					models.ReglaAcreditacion.examen_final_id == examen_final_id,
					models.ReglaAcreditacion.examen_final_id.is_(None),
				)
			)
		else:
			stmt = stmt.where(models.ReglaAcreditacion.examen_final_id.is_(None))
		
		stmt = stmt.order_by(
			models.ReglaAcreditacion.examen_final_id.isnot(None).desc()
		).limit(1)
		
		result = await self.db.execute(stmt)
		return result.scalar_one_or_none()

	async def validate_quizzes_aprobados(
		self,
		curso_id: uuid.UUID,
		usuario_id: uuid.UUID,
		inscripcion_curso_id: uuid.UUID,
	) -> None:
		"""
		Validar que todos los quizzes de las lecciones del curso estén aprobados.
		Nota: El trigger de BD también valida esto, pero es útil para dar feedback antes.
		"""
		stmt = text("""
			SELECT q.id, q.leccion_id
			FROM quiz q
			JOIN leccion l ON l.id = q.leccion_id
			JOIN modulo_curso mc ON mc.modulo_id = l.modulo_id
			WHERE mc.curso_id = :curso_id
		""")
		
		result = await self.db.execute(stmt, {"curso_id": curso_id})
		quizzes = result.fetchall()
		
		if not quizzes:
			return
		
		quiz_ids = [row[0] for row in quizzes]
		
		stmt_intentos = select(models.Intento).where(
			and_(
				models.Intento.usuario_id == usuario_id,
				models.Intento.quiz_id.in_(quiz_ids),
				models.Intento.inscripcion_curso_id == inscripcion_curso_id,
				models.Intento.resultado == ResultadoIntento.APROBADO,
			)
		)
		
		result_intentos = await self.db.execute(stmt_intentos)
		intentos_aprobados = result_intentos.scalars().all()
		
		quizzes_aprobados_ids = {intento.quiz_id for intento in intentos_aprobados}
		
		quizzes_pendientes = [qid for qid in quiz_ids if qid not in quizzes_aprobados_ids]
		
		if quizzes_pendientes:
			raise BusinessRuleError(
				f"Debes aprobar todos los quizzes de las lecciones antes de realizar el examen final. "
				f"Quizzes pendientes: {len(quizzes_pendientes)}"
			)

	async def validate_max_intentos(
		self,
		usuario_id: uuid.UUID,
		examen_final_id: uuid.UUID,
		inscripcion_curso_id: uuid.UUID,
	) -> None:
		"""Validar que no se exceda el máximo de intentos."""
		examen = await self.get_examen_final(examen_final_id)
		
		regla = await self.get_regla_acreditacion(
			examen.curso_id,
			examen_final_id=examen_final_id,
		)
		
		max_intentos = regla.max_intentos_quiz if regla else 3
		
		stmt = select(func.count(models.Intento.id)).where(
			and_(
				models.Intento.usuario_id == usuario_id,
				models.Intento.examen_final_id == examen_final_id,
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
		examen_final_id: uuid.UUID,
		inscripcion_curso_id: uuid.UUID,
	) -> models.Intento:
		"""Iniciar un nuevo intento de examen final."""
		examen = await self.get_examen_final(examen_final_id)
		
		await self.validate_quizzes_aprobados(
			examen.curso_id,
			usuario_id,
			inscripcion_curso_id,
		)
		
		await self.validate_max_intentos(
			usuario_id,
			examen_final_id,
			inscripcion_curso_id,
		)
		
		intento = await self.intento_service.create_intento(
			usuario_id=usuario_id,
			inscripcion_curso_id=inscripcion_curso_id,
			examen_final_id=examen_final_id,
		)
		
		examen = await self.get_examen_final_with_preguntas(examen_final_id)
		
		orden = 1
		for pregunta in examen.preguntas:
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
		
		logger.info("Intento de examen final %s iniciado para usuario %s", examen_final_id, usuario_id)
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
		
		examen = await self.get_examen_final(intento.examen_final_id)
		
		regla = await self.get_regla_acreditacion(
			examen.curso_id,
			examen_final_id=intento.examen_final_id,
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
		examen_final_id: uuid.UUID,
		usuario_id: Optional[uuid.UUID] = None,
		skip: int = 0,
		limit: int = 100,
	) -> List[models.Intento]:
		"""Listar intentos de un examen final."""
		stmt = select(models.Intento).where(models.Intento.examen_final_id == examen_final_id)
		
		if usuario_id:
			stmt = stmt.where(models.Intento.usuario_id == usuario_id)
		
		stmt = stmt.order_by(models.Intento.numero_intento.desc()).offset(skip).limit(limit)
		result = await self.db.execute(stmt)
		return result.scalars().all()

	async def get_inscripcion_curso_from_examen(
		self,
		examen_final_id: uuid.UUID,
		usuario_id: uuid.UUID,
	) -> models.InscripcionCurso:
		"""
		Obtener la inscripción del usuario al curso asociado al examen final.
		Valida que el usuario esté inscrito en el curso.
		"""
		examen = await self.get_examen_final(examen_final_id)
		
		inscripcion = await self.inscripcion_service.get_inscripcion_by_usuario_curso(
			usuario_id=usuario_id,
			curso_id=examen.curso_id,
		)
		
		if not inscripcion:
			raise AuthorizationError("No estás inscrito en este curso")
		
		return inscripcion

	async def get_intento_activo(
		self,
		examen_final_id: uuid.UUID,
		usuario_id: uuid.UUID,
		inscripcion_curso_id: uuid.UUID,
	) -> models.Intento:
		"""Obtener el intento activo (no finalizado) para un examen final."""
		stmt = select(models.Intento).where(
			and_(
				models.Intento.usuario_id == usuario_id,
				models.Intento.examen_final_id == examen_final_id,
				models.Intento.inscripcion_curso_id == inscripcion_curso_id,
				models.Intento.finalizado_en.is_(None),
			)
		)
		result = await self.db.execute(stmt)
		intento = result.scalar_one_or_none()
		
		if not intento:
			raise ValidationError("No hay un intento activo para este examen final")
		
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
		
		examen = await self.get_examen_final(intento.examen_final_id)
		
		regla = await self.get_regla_acreditacion(
			examen.curso_id,
			examen_final_id=intento.examen_final_id,
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
		examen_final_id: uuid.UUID,
	) -> models.Intento:
		"""
		Iniciar intento de examen final con validación de inscripción.
		Este método encapsula toda la lógica: obtiene inscripción, valida acceso e inicia intento.
		"""
		inscripcion = await self.get_inscripcion_curso_from_examen(examen_final_id, usuario_id)
		
		return await self.iniciar_intento(
			usuario_id=usuario_id,
			examen_final_id=examen_final_id,
			inscripcion_curso_id=inscripcion.id,
		)

	async def enviar_respuestas_con_validacion(
		self,
		usuario_id: uuid.UUID,
		examen_final_id: uuid.UUID,
		respuestas: List[dict],
	) -> IntentoResult:
		"""
		Enviar respuestas de un examen final con validación completa.
		Este método encapsula toda la lógica: valida inscripción, obtiene intento activo, envía respuestas y construye resultado.
		"""
		inscripcion = await self.get_inscripcion_curso_from_examen(examen_final_id, usuario_id)
		
		intento_activo = await self.get_intento_activo(examen_final_id, usuario_id, inscripcion.id)
		
		intento = await self.enviar_respuestas(
			intento_id=intento_activo.id,
			respuestas=respuestas,
		)
		
		return await self.construir_intento_result(intento)

