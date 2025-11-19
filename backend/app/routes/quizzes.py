import logging
from typing import List, Optional
from uuid import UUID
from decimal import Decimal

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.database import models
from app.database.enums import ResultadoIntento
from app.schemas.quiz import QuizConPreguntas, QuizDetailResponse, PreguntaConOpciones, OpcionResponse, PreguntaConfigResponse
from app.schemas.intento import IntentoResponse, IntentoSubmission, IntentoResult, RespuestaResponse
from app.services.quiz_service import QuizService
from app.services.usuario_service import UsuarioService
from app.services.leccion_service import LeccionService
from app.utils.jwt_auth import get_current_user
from app.utils.roles import is_admin
from app.utils.exceptions import AuthorizationError, ValidationError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])


@router.get(
	"/{quiz_id}",
	response_model=QuizConPreguntas,
	status_code=status.HTTP_200_OK,
)
async def get_quiz(
	quiz_id: UUID,
	db: AsyncSession = Depends(get_db),
	token_payload: Optional[dict] = Depends(get_current_user),
):
	"""Obtener quiz con todas sus preguntas y opciones."""
	service = QuizService(db)
	
	usuario_id = None
	admin = False
	if token_payload:
		usuario_service = UsuarioService(db)
		usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
		if usuario:
			usuario_id = usuario.id
		admin = is_admin(token_payload)
	
	quiz = await service.get_quiz_with_preguntas(quiz_id)
	
	if not admin and usuario_id:
		leccion_service = LeccionService(db)
		await leccion_service.validate_acceso_leccion(quiz.leccion_id, usuario_id, admin)
	
	preguntas_response = []
	for pregunta in quiz.preguntas:
		opciones_response = [
			OpcionResponse.from_orm(opcion) for opcion in pregunta.opciones
		]
		
		config_response = None
		if pregunta.config:
			config_response = PreguntaConfigResponse.from_orm(pregunta.config)
		
		preguntas_response.append(
			PreguntaConOpciones(
				id=pregunta.id,
				quiz_id=pregunta.quiz_id,
				examen_final_id=pregunta.examen_final_id,
				enunciado=pregunta.enunciado,
				puntos=pregunta.puntos,
				orden=pregunta.orden,
				creado_en=pregunta.creado_en,
				actualizado_en=pregunta.actualizado_en,
				opciones=opciones_response,
				config=config_response,
			)
		)
	
	return QuizConPreguntas(
		id=quiz.id,
		leccion_id=quiz.leccion_id,
		titulo=quiz.titulo,
		publicado=quiz.publicado,
		aleatorio=quiz.aleatorio,
		guarda_calificacion=quiz.guarda_calificacion,
		creado_en=quiz.creado_en,
		actualizado_en=quiz.actualizado_en,
		numero_preguntas=len(quiz.preguntas),
		preguntas=preguntas_response,
	)


@router.post(
	"/{quiz_id}/iniciar",
	response_model=IntentoResponse,
	status_code=status.HTTP_201_CREATED,
)
async def iniciar_intento_quiz(
	quiz_id: UUID,
	db: AsyncSession = Depends(get_db),
	token_payload: dict = Depends(get_current_user),
):
	"""Iniciar un nuevo intento de quiz."""
	service = QuizService(db)
	usuario_service = UsuarioService(db)
	
	usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
	if not usuario:
		raise AuthorizationError("Usuario no encontrado")
	
	quiz = await service.get_quiz(quiz_id)
	leccion_service = LeccionService(db)
	leccion = await leccion_service.get_leccion(quiz.leccion_id)
	
	modulo_curso = await db.execute(
		select(models.ModuloCurso)
		.where(models.ModuloCurso.modulo_id == leccion.modulo_id)
		.limit(1)
	)
	modulo_curso_obj = modulo_curso.scalar_one_or_none()
	
	if not modulo_curso_obj:
		raise ValidationError("No se encontró curso asociado")
	
	inscripcion = await db.execute(
		select(models.InscripcionCurso).where(
			and_(
				models.InscripcionCurso.usuario_id == usuario.id,
				models.InscripcionCurso.curso_id == modulo_curso_obj.curso_id,
			)
		)
	)
	inscripcion_obj = inscripcion.scalar_one_or_none()
	
	if not inscripcion_obj:
		raise AuthorizationError("No estás inscrito en este curso")
	
	intento = await service.iniciar_intento(
		usuario_id=usuario.id,
		quiz_id=quiz_id,
		inscripcion_curso_id=inscripcion_obj.id,
	)
	
	return IntentoResponse.from_orm(intento)


@router.post(
	"/{quiz_id}/enviar",
	response_model=IntentoResult,
	status_code=status.HTTP_200_OK,
)
async def enviar_respuestas_quiz(
	quiz_id: UUID,
	payload: IntentoSubmission,
	db: AsyncSession = Depends(get_db),
	token_payload: dict = Depends(get_current_user),
):
	"""Enviar respuestas de un quiz y obtener resultado."""
	service = QuizService(db)
	usuario_service = UsuarioService(db)
	
	usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
	if not usuario:
		raise AuthorizationError("Usuario no encontrado")
	
	quiz = await service.get_quiz(quiz_id)
	leccion_service = LeccionService(db)
	leccion = await leccion_service.get_leccion(quiz.leccion_id)
	
	modulo_curso = await db.execute(
		select(models.ModuloCurso)
		.where(models.ModuloCurso.modulo_id == leccion.modulo_id)
		.limit(1)
	)
	modulo_curso_obj = modulo_curso.scalar_one_or_none()
	
	if not modulo_curso_obj:
		raise ValidationError("No se encontró curso asociado")
	
	inscripcion = await db.execute(
		select(models.InscripcionCurso).where(
			and_(
				models.InscripcionCurso.usuario_id == usuario.id,
				models.InscripcionCurso.curso_id == modulo_curso_obj.curso_id,
			)
		)
	)
	inscripcion_obj = inscripcion.scalar_one_or_none()
	
	if not inscripcion_obj:
		raise AuthorizationError("No estás inscrito en este curso")
	
	intento_activo = await db.execute(
		select(models.Intento).where(
			and_(
				models.Intento.usuario_id == usuario.id,
				models.Intento.quiz_id == quiz_id,
				models.Intento.inscripcion_curso_id == inscripcion_obj.id,
				models.Intento.finalizado_en.is_(None),
			)
		)
	)
	intento_obj = intento_activo.scalar_one_or_none()
	
	if not intento_obj:
		raise ValidationError("No hay un intento activo para este quiz")
	
	intento = await service.enviar_respuestas(
		intento_id=intento_obj.id,
		respuestas=[r.dict() for r in payload.respuestas],
	)
	
	puntaje_total, puntaje_maximo, preguntas_correctas, total_preguntas = await service.calcular_puntaje(intento.id)
	
	regla = await service.get_regla_acreditacion(
		modulo_curso_obj.curso_id,
		quiz_id=quiz_id,
	)
	
	min_score = regla.min_score_aprobatorio if regla else Decimal("80.00")
	porcentaje = (puntaje_total / puntaje_maximo * 100) if puntaje_maximo > 0 else Decimal("0")
	
	respuestas_stmt = await db.execute(
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


@router.get(
	"/{quiz_id}/intentos",
	response_model=List[IntentoResponse],
	status_code=status.HTTP_200_OK,
)
async def list_intentos_quiz(
	quiz_id: UUID,
	db: AsyncSession = Depends(get_db),
	token_payload: Optional[dict] = Depends(get_current_user),
):
	"""Obtener historial de intentos de un quiz."""
	service = QuizService(db)
	
	usuario_id = None
	if token_payload:
		usuario_service = UsuarioService(db)
		usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
		if usuario:
			usuario_id = usuario.id
	
	intentos = await service.list_intentos(quiz_id, usuario_id=usuario_id)
	return [IntentoResponse.from_orm(intento) for intento in intentos]

