import logging
import uuid
from typing import Optional, List
from decimal import Decimal
from datetime import datetime, date

from sqlalchemy import select, and_, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import models
from app.database.enums import EstadoInscripcion, ResultadoIntento
from app.utils.exceptions import NotFoundError
from app.schemas.progress import (
	ProgressResponse,
	ProgressModuloResponse,
	ProgressGeneralResponse,
	ProgressComparisonItem,
	ProgressComparisonResponse,
)

logger = logging.getLogger(__name__)


class ProgresoService:
	"""Lógica de negocio para cálculo de progreso."""

	def __init__(self, db: AsyncSession):
		self.db = db

	async def get_progreso_curso(
		self,
		usuario_id: uuid.UUID,
		curso_id: uuid.UUID,
	) -> ProgressResponse:
		"""
		Calcular progreso en un curso específico.
		Incluye: lecciones completadas, quizzes aprobados, examen final, calificaciones.
		"""
		inscripcion = await self.db.execute(
			select(models.InscripcionCurso)
			.options(selectinload(models.InscripcionCurso.curso))
			.where(
				and_(
					models.InscripcionCurso.usuario_id == usuario_id,
					models.InscripcionCurso.curso_id == curso_id,
				)
			)
		)
		inscripcion_obj = inscripcion.scalar_one_or_none()
		
		if not inscripcion_obj:
			raise NotFoundError("Inscripción", f"usuario {usuario_id}, curso {curso_id}")
		
		curso = inscripcion_obj.curso
		
		modulo_curso = await self.db.execute(
			select(models.ModuloCurso)
			.where(models.ModuloCurso.curso_id == curso_id)
			.limit(1)
		)
		modulo_curso_obj = modulo_curso.scalar_one_or_none()
		
		if not modulo_curso_obj:
			return ProgressResponse(
				curso_id=curso_id,
				curso_titulo=curso.titulo,
				inscripcion_id=inscripcion_obj.id,
				estado=inscripcion_obj.estado,
				acreditado=inscripcion_obj.acreditado,
				fecha_inscripcion=inscripcion_obj.fecha_inscripcion,
				fecha_conclusion=inscripcion_obj.fecha_conclusion,
				acreditado_en=inscripcion_obj.acreditado_en,
			)
		
		modulo_id = modulo_curso_obj.modulo_id
		
		stmt_lecciones = text("""
			SELECT COUNT(*) as total
			FROM leccion l
			WHERE l.modulo_id = :modulo_id AND l.publicado = TRUE
		""")
		result_lecciones = await self.db.execute(stmt_lecciones, {"modulo_id": modulo_id})
		total_lecciones = result_lecciones.scalar_one() or 0
		
		stmt_quizzes = text("""
			SELECT COUNT(*) as total
			FROM quiz q
			JOIN leccion l ON l.id = q.leccion_id
			WHERE l.modulo_id = :modulo_id AND q.publicado = TRUE
		""")
		result_quizzes = await self.db.execute(stmt_quizzes, {"modulo_id": modulo_id})
		total_quizzes = result_quizzes.scalar_one() or 0
		
		stmt_quizzes_aprobados = select(func.count(models.Intento.id)).where(
			and_(
				models.Intento.usuario_id == usuario_id,
				models.Intento.inscripcion_curso_id == inscripcion_obj.id,
				models.Intento.quiz_id.isnot(None),
				models.Intento.resultado == ResultadoIntento.APROBADO,
			)
		)
		result_quizzes_aprobados = await self.db.execute(stmt_quizzes_aprobados)
		quizzes_aprobados = result_quizzes_aprobados.scalar_one() or 0
		
		stmt_quizzes_completados = select(func.count(func.distinct(models.Intento.quiz_id))).where(
			and_(
				models.Intento.usuario_id == usuario_id,
				models.Intento.inscripcion_curso_id == inscripcion_obj.id,
				models.Intento.quiz_id.isnot(None),
				models.Intento.finalizado_en.isnot(None),
			)
		)
		result_quizzes_completados = await self.db.execute(stmt_quizzes_completados)
		quizzes_completados = result_quizzes_completados.scalar_one() or 0
		
		stmt_lecciones_completadas = text("""
			SELECT COUNT(DISTINCT l.id) as total
			FROM leccion l
			JOIN quiz q ON q.leccion_id = l.id
			JOIN intento i ON i.quiz_id = q.id
			WHERE l.modulo_id = :modulo_id
				AND i.usuario_id = :usuario_id
				AND i.inscripcion_curso_id = :inscripcion_id
				AND i.resultado = 'APROBADO'
				AND i.finalizado_en IS NOT NULL
		""")
		result_lecciones_completadas = await self.db.execute(
			stmt_lecciones_completadas,
			{
				"modulo_id": modulo_id,
				"usuario_id": usuario_id,
				"inscripcion_id": inscripcion_obj.id,
			},
		)
		lecciones_completadas = result_lecciones_completadas.scalar_one() or 0
		
		examen_final = await self.db.execute(
			select(models.ExamenFinal).where(models.ExamenFinal.curso_id == curso_id)
		)
		examen_final_obj = examen_final.scalar_one_or_none()
		
		examen_final_completado = False
		examen_final_aprobado = False
		puntaje_examen_final = None
		
		if examen_final_obj:
			intento_examen = await self.db.execute(
				select(models.Intento).where(
					and_(
						models.Intento.usuario_id == usuario_id,
						models.Intento.examen_final_id == examen_final_obj.id,
						models.Intento.inscripcion_curso_id == inscripcion_obj.id,
						models.Intento.finalizado_en.isnot(None),
					)
				).order_by(models.Intento.finalizado_en.desc())
				.limit(1)
			)
			intento_examen_obj = intento_examen.scalar_one_or_none()
			
			if intento_examen_obj:
				examen_final_completado = True
				examen_final_aprobado = intento_examen_obj.resultado == ResultadoIntento.APROBADO
				if intento_examen_obj.puntaje:
					puntaje_examen_final = Decimal(str(intento_examen_obj.puntaje))
		
		porcentaje_lecciones = (
			(Decimal(str(lecciones_completadas)) / Decimal(str(total_lecciones)) * 100)
			if total_lecciones > 0
			else Decimal("0.00")
		)
		
		porcentaje_quizzes = (
			(Decimal(str(quizzes_aprobados)) / Decimal(str(total_quizzes)) * 100)
			if total_quizzes > 0
			else Decimal("0.00")
		)
		
		progreso_general = (
			(porcentaje_lecciones * Decimal("0.4") + porcentaje_quizzes * Decimal("0.6"))
			if total_quizzes > 0
			else porcentaje_lecciones
		)
		
		stmt_calificacion = select(func.avg(models.Intento.puntaje)).where(
			and_(
				models.Intento.usuario_id == usuario_id,
				models.Intento.inscripcion_curso_id == inscripcion_obj.id,
				models.Intento.puntaje.isnot(None),
			)
		)
		result_calificacion = await self.db.execute(stmt_calificacion)
		calificacion_promedio = result_calificacion.scalar_one()
		if calificacion_promedio:
			calificacion_promedio = Decimal(str(calificacion_promedio))
		
		stmt_ultima_actividad = select(func.max(models.Intento.finalizado_en)).where(
			and_(
				models.Intento.usuario_id == usuario_id,
				models.Intento.inscripcion_curso_id == inscripcion_obj.id,
			)
		)
		result_ultima_actividad = await self.db.execute(stmt_ultima_actividad)
		ultima_actividad = result_ultima_actividad.scalar_one()
		
		return ProgressResponse(
			curso_id=curso_id,
			curso_titulo=curso.titulo,
			inscripcion_id=inscripcion_obj.id,
			estado=inscripcion_obj.estado,
			acreditado=inscripcion_obj.acreditado,
			lecciones_completadas=lecciones_completadas,
			total_lecciones=total_lecciones,
			porcentaje_lecciones=porcentaje_lecciones,
			quizzes_completados=quizzes_completados,
			total_quizzes=total_quizzes,
			quizzes_aprobados=quizzes_aprobados,
			porcentaje_quizzes=porcentaje_quizzes,
			examen_final_completado=examen_final_completado,
			examen_final_aprobado=examen_final_aprobado,
			progreso_general=progreso_general,
			fecha_inscripcion=inscripcion_obj.fecha_inscripcion,
			fecha_conclusion=inscripcion_obj.fecha_conclusion,
			acreditado_en=inscripcion_obj.acreditado_en,
			ultima_actividad=ultima_actividad,
			calificacion_promedio=calificacion_promedio,
			puntaje_examen_final=puntaje_examen_final,
		)

	async def get_progreso_modulo(
		self,
		usuario_id: uuid.UUID,
		modulo_id: uuid.UUID,
	) -> ProgressModuloResponse:
		"""
		Calcular progreso en un módulo completo usando la vista inscripcion_modulo_calculada.
		"""
		modulo = await self.db.execute(
			select(models.Modulo).where(models.Modulo.id == modulo_id)
		)
		modulo_obj = modulo.scalar_one_or_none()
		
		if not modulo_obj:
			raise NotFoundError("Módulo", str(modulo_id))
		
		stmt_vista = text("""
			SELECT 
				usuario_id,
				modulo_id,
				estado,
				acreditado,
				acreditado_en,
				fecha_inscripcion,
				fecha_conclusion
			FROM inscripcion_modulo_calculada
			WHERE usuario_id = :usuario_id AND modulo_id = :modulo_id
		""")
		
		result_vista = await self.db.execute(
			stmt_vista,
			{"usuario_id": usuario_id, "modulo_id": modulo_id},
		)
		row = result_vista.fetchone()
		
		if not row:
			return ProgressModuloResponse(
				modulo_id=modulo_id,
				modulo_titulo=modulo_obj.titulo,
				estado=EstadoInscripcion.ACTIVA,
				acreditado=False,
			)
		
		estado = EstadoInscripcion(row[2])
		acreditado = row[3]
		acreditado_en = row[4]
		fecha_inscripcion = row[5]
		fecha_conclusion = row[6]
		
		cursos_modulo = await self.db.execute(
			select(models.ModuloCurso)
			.where(models.ModuloCurso.modulo_id == modulo_id)
			.order_by(models.ModuloCurso.slot)
		)
		cursos_modulo_list = cursos_modulo.scalars().all()
		
		total_cursos = len(cursos_modulo_list)
		
		progreso_cursos = []
		cursos_completados = 0
		cursos_en_progreso = 0
		
		for modulo_curso in cursos_modulo_list:
			try:
				progreso_curso = await self.get_progreso_curso(usuario_id, modulo_curso.curso_id)
				progreso_cursos.append(progreso_curso)
				
				if progreso_curso.estado == EstadoInscripcion.CONCLUIDA:
					cursos_completados += 1
				elif progreso_curso.estado == EstadoInscripcion.ACTIVA:
					cursos_en_progreso += 1
			except NotFoundError:
				pass
		
		porcentaje_cursos = (
			(Decimal(str(cursos_completados)) / Decimal(str(total_cursos)) * 100)
			if total_cursos > 0
			else Decimal("0.00")
		)
		
		progreso_general = porcentaje_cursos
		
		return ProgressModuloResponse(
			modulo_id=modulo_id,
			modulo_titulo=modulo_obj.titulo,
			estado=estado,
			acreditado=acreditado,
			cursos_completados=cursos_completados,
			total_cursos=total_cursos,
			cursos_en_progreso=cursos_en_progreso,
			porcentaje_cursos=porcentaje_cursos,
			progreso_general=progreso_general,
			fecha_inscripcion=fecha_inscripcion,
			fecha_conclusion=fecha_conclusion,
			acreditado_en=acreditado_en,
			progreso_cursos=progreso_cursos,
		)

	async def get_progreso_general(
		self,
		usuario_id: uuid.UUID,
	) -> ProgressGeneralResponse:
		"""Calcular progreso general del usuario."""
		inscripciones = await self.db.execute(
			select(models.InscripcionCurso)
			.where(models.InscripcionCurso.usuario_id == usuario_id)
		)
		inscripciones_list = inscripciones.scalars().all()
		
		total_cursos_inscritos = len(inscripciones_list)
		total_cursos_completados = sum(
			1 for ic in inscripciones_list
			if ic.estado == EstadoInscripcion.CONCLUIDA
		)
		total_cursos_acreditados = sum(1 for ic in inscripciones_list if ic.acreditado)
		
		modulos_inscritos = await self.db.execute(
			text("""
				SELECT DISTINCT modulo_id, estado, acreditado
				FROM inscripcion_modulo_calculada
				WHERE usuario_id = :usuario_id
			"""),
			{"usuario_id": usuario_id},
		)
		modulos_list = modulos_inscritos.fetchall()
		total_modulos_inscritos = len(modulos_list)
		
		modulos_completados = sum(
			1 for row in modulos_list
			if EstadoInscripcion(row[1]) == EstadoInscripcion.CONCLUIDA
		)
		
		modulos_acreditados = sum(1 for row in modulos_list if row[2] == True)
		
		progreso_general = (
			(Decimal(str(total_cursos_completados)) / Decimal(str(total_cursos_inscritos)) * 100)
			if total_cursos_inscritos > 0
			else Decimal("0.00")
		)
		
		stmt_calificacion = select(func.avg(models.Intento.puntaje)).where(
			and_(
				models.Intento.usuario_id == usuario_id,
				models.Intento.puntaje.isnot(None),
			)
		)
		result_calificacion = await self.db.execute(stmt_calificacion)
		calificacion_promedio = result_calificacion.scalar_one()
		if calificacion_promedio:
			calificacion_promedio = Decimal(str(calificacion_promedio))
		
		certificados = await self.db.execute(
			select(func.count(models.Certificado.id)).where(
				and_(
					models.Certificado.inscripcion_curso_id.in_(
						select(models.InscripcionCurso.id).where(
							models.InscripcionCurso.usuario_id == usuario_id
						)
					),
					models.Certificado.valido == True,
				)
			)
		)
		certificados_obtenidos = certificados.scalar_one() or 0
		
		stmt_ultima_actividad = select(func.max(models.Intento.finalizado_en)).where(
			models.Intento.usuario_id == usuario_id
		)
		result_ultima_actividad = await self.db.execute(stmt_ultima_actividad)
		ultima_actividad = result_ultima_actividad.scalar_one()
		
		return ProgressGeneralResponse(
			usuario_id=usuario_id,
			total_cursos_inscritos=total_cursos_inscritos,
			total_cursos_completados=total_cursos_completados,
			total_cursos_acreditados=total_cursos_acreditados,
			total_modulos_inscritos=total_modulos_inscritos,
			total_modulos_completados=modulos_completados,
			total_modulos_acreditados=modulos_acreditados,
			progreso_general=progreso_general,
			calificacion_promedio=calificacion_promedio,
			certificados_obtenidos=certificados_obtenidos,
			ultima_actividad=ultima_actividad,
		)

	async def get_comparacion_progreso(
		self,
		usuario_id: uuid.UUID,
		curso_id: uuid.UUID,
	) -> ProgressComparisonResponse:
		"""
		Comparar progreso del usuario con otros estudiantes del mismo curso.
		"""
		curso = await self.db.execute(
			select(models.Curso).where(models.Curso.id == curso_id)
		)
		curso_obj = curso.scalar_one_or_none()
		
		if not curso_obj:
			raise NotFoundError("Curso", str(curso_id))
		
		mi_progreso = await self.get_progreso_curso(usuario_id, curso_id)
		
		inscripciones_curso = await self.db.execute(
			select(models.InscripcionCurso)
			.options(selectinload(models.InscripcionCurso.usuario))
			.where(models.InscripcionCurso.curso_id == curso_id)
		)
		inscripciones_list = inscripciones_curso.scalars().all()
		
		total_estudiantes = len(inscripciones_list)
		
		progresos_estudiantes = []
		for inscripcion in inscripciones_list:
			try:
				progreso = await self.get_progreso_curso(inscripcion.usuario_id, curso_id)
				progresos_estudiantes.append({
					"usuario_id": inscripcion.usuario_id,
					"nombre": inscripcion.usuario.nombre,
					"apellido": inscripcion.usuario.apellido,
					"avatar_url": inscripcion.usuario.avatar_url,
					"progreso": progreso.progreso_general,
					"calificacion": progreso.calificacion_promedio,
				})
			except NotFoundError:
				pass
		
		progresos_estudiantes.sort(key=lambda x: x["progreso"], reverse=True)
		
		promedio_general = (
			sum(p["progreso"] for p in progresos_estudiantes) / len(progresos_estudiantes)
			if progresos_estudiantes
			else Decimal("0.00")
		)
		
		mi_posicion = None
		total_estudiantes_mejores = 0
		total_estudiantes_peores = 0
		
		for idx, estudiante in enumerate(progresos_estudiantes):
			if estudiante["usuario_id"] == usuario_id:
				mi_posicion = idx + 1
				total_estudiantes_mejores = idx
				total_estudiantes_peores = len(progresos_estudiantes) - idx - 1
				break
		
		top_estudiantes = []
		for idx, estudiante in enumerate(progresos_estudiantes[:10]):
			top_estudiantes.append(
				ProgressComparisonItem(
					usuario_id=estudiante["usuario_id"],
					nombre=estudiante["nombre"],
					apellido=estudiante["apellido"],
					avatar_url=estudiante["avatar_url"],
					progreso=estudiante["progreso"],
					calificacion_promedio=estudiante["calificacion"],
					posicion=idx + 1,
				)
			)
		
		percentil = None
		if mi_posicion and total_estudiantes > 0:
			percentil = int((total_estudiantes - mi_posicion + 1) / total_estudiantes * 100)
		
		return ProgressComparisonResponse(
			curso_id=curso_id,
			curso_titulo=curso_obj.titulo,
			mi_progreso=mi_progreso,
			total_estudiantes=total_estudiantes,
			promedio_general=promedio_general,
			mi_posicion=mi_posicion,
			total_estudiantes_mejores=total_estudiantes_mejores,
			total_estudiantes_peores=total_estudiantes_peores,
			top_estudiantes=top_estudiantes,
			percentil=percentil,
		)
